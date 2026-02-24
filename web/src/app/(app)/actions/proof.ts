'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, tryCreateAdminClient } from '@/lib/supabase/admin'
import { getUserMembership } from '@/lib/db/client'
import { getDeliverableById, updateDeliverableStatus } from '@/lib/db/deliverables'
import { notifyOrgAdmins } from '@/lib/db/notifications'
import { canEditContent, canDeleteProof, canManageContent } from '@/lib/permissions'
import { isUuid } from '@/lib/validation'
import type { OrgRole } from '@/lib/types/database'
import {
  isAllowedProofType,
  MAX_PROOF_SIZE,
  ALLOWED_PROOF_TYPES,
  buildStoragePath,
  extractStoragePath,
} from '@/lib/proof-utils'
import { logActivity } from '@/lib/db/activity-log'
import { fireWebhook } from '@/lib/webhooks/dispatch'
import { requiresApproval } from '@/lib/approval'
import { CATEGORY_CONFIG } from '@/lib/constants'
import type { Proof, OrgSettings } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Auth helper — validates user session via regular client
// ---------------------------------------------------------------------------

async function getAuthenticatedContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' as const }
  }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) {
    return { error: 'No organization membership' as const }
  }

  return { supabase, user, orgId: membership.org_id, role: membership.role as OrgRole }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isTableMissingError(error: { message?: string; code?: string }): boolean {
  const msg = error.message?.toLowerCase() ?? ''
  return (
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    error.code === '42P01'
  )
}

function isBucketNotFoundError(msg: string): boolean {
  const lower = msg.toLowerCase()
  return lower.includes('bucket') && lower.includes('not found')
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export async function uploadProofAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; proof?: Proof }> {
  try {
    // 1. Auth
    const auth = await getAuthenticatedContext()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }
    const { user, orgId } = auth

    // 2. Validate deliverable_id
    const deliverableId = formData.get('deliverable_id') as string | null
    if (!deliverableId || !isUuid(deliverableId)) {
      return { ok: false, error: 'Invalid deliverable ID' }
    }

    // 3. Validate file
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) {
      return { ok: false, error: 'No file provided' }
    }

    if (file.size > MAX_PROOF_SIZE) {
      return { ok: false, error: 'File exceeds 10 MB limit' }
    }

    if (!isAllowedProofType(file.type)) {
      return { ok: false, error: 'File type not allowed. Accepted: JPEG, PNG, WebP, GIF, PDF, MP4, MOV' }
    }

    // Convert File to Buffer — File objects may not survive the Next.js
    // server-action serialization boundary intact.
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const fileType = file.type
    const fileSize = file.size

    // 4. Verify deliverable exists
    const deliverable = await getDeliverableById(deliverableId)
    if (!deliverable) {
      return { ok: false, error: 'Deliverable not found' }
    }

    // 5. Upload to Supabase Storage (admin client — bypasses RLS)
    const admin = createAdminClient()
    const storagePath = buildStoragePath(orgId, deliverableId, fileName)

    const { error: uploadError } = await admin.storage
      .from('proof')
      .upload(storagePath, fileBuffer, {
        contentType: fileType,
        upsert: false,
      })

    if (uploadError) {
      // Self-healing: if bucket doesn't exist, create it and retry
      if (isBucketNotFoundError(uploadError.message ?? '')) {
        console.log('[Proof] Bucket not found — creating "proof" bucket...')
        const { error: bucketError } = await admin.storage.createBucket('proof', {
          public: true,
          fileSizeLimit: MAX_PROOF_SIZE,
          allowedMimeTypes: [...ALLOWED_PROOF_TYPES],
        })
        if (bucketError) {
          console.error('[Proof] Failed to create bucket:', bucketError)
          return { ok: false, error: 'Storage not available. Please contact support.' }
        }
        // Retry upload
        const { error: retryError } = await admin.storage
          .from('proof')
          .upload(storagePath, fileBuffer, {
            contentType: fileType,
            upsert: false,
          })
        if (retryError) {
          console.error('[Proof] Upload failed after bucket creation:', retryError)
          return { ok: false, error: 'Failed to upload file' }
        }
      } else {
        console.error('Storage upload error:', uploadError)
        return { ok: false, error: 'Failed to upload file' }
      }
    }

    // 6. Get public URL
    const { data: urlData } = admin.storage
      .from('proof')
      .getPublicUrl(storagePath)

    // 7. Create DB record (admin client — bypasses RLS)
    const { data: proof, error: dbError } = await admin
      .from('proofs')
      .insert({
        deliverable_id: deliverableId,
        org_id: orgId,
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        uploaded_by: user.id,
        validation_status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Proof] DB insert error:', dbError)
      // Clean up uploaded file
      await admin.storage.from('proof').remove([storagePath]).catch(() => {})

      if (isTableMissingError(dbError)) {
        return {
          ok: false,
          error: 'Proof storage is not fully set up. Run the proofs table migration in the Supabase SQL Editor (see supabase/migrations/00005_proof_storage.sql).',
        }
      }
      return { ok: false, error: 'Failed to save proof record' }
    }

    // 8. Auto-advance status: done → proved (or pending_approval if category requires approval)
    const notifyAdmin = tryCreateAdminClient()
    let orgSettings: OrgSettings | null = null
    if (notifyAdmin) {
      const { data: orgRow } = await notifyAdmin.from('organizations').select('settings').eq('id', orgId).single()
      orgSettings = (orgRow?.settings ?? {}) as OrgSettings
    }

    if (deliverable.status === 'done') {
      const needsApproval = requiresApproval(deliverable.category, orgSettings)
      await updateDeliverableStatus(
        deliverableId,
        needsApproval ? 'pending_approval' : 'proved',
      )

      if (needsApproval && notifyAdmin) {
        notifyOrgAdmins(notifyAdmin, orgId, user.id, {
          type: 'pending_approval',
          title: `${CATEGORY_CONFIG[deliverable.category].label} deliverable pending your approval`,
          body: `"${deliverable.title}" — admin review required`,
          link: `/events/${deliverable.event_id}/partners/${deliverable.partner_id}/deliverables/${deliverableId}`,
        }).catch(() => {})
      }

      if (!needsApproval) {
        fireWebhook('deliverable_proved', orgId, {
          deliverable_id: deliverableId,
          title: deliverable.title,
          category: deliverable.category,
          event_id: deliverable.event_id,
          partner_id: deliverable.partner_id,
        })
      }
    }

    // 9. Notify org admins of proof upload
    if (notifyAdmin) {
      notifyOrgAdmins(notifyAdmin, orgId, user.id, {
        type: 'proof_uploaded',
        title: `Proof uploaded for "${deliverable.title}"`,
        body: fileName,
        link: `/events/${deliverable.event_id}/partners/${deliverable.partner_id}`,
      }).catch(() => {}) // Non-critical
    }

    // 10. Log activity
    logActivity({ orgId, userId: user.id, action: 'uploaded_proof', targetType: 'proof', targetId: proof.id, eventId: deliverable.event_id, details: { file_name: fileName, deliverable_title: deliverable.title, partner_id: deliverable.partner_id, actor_email: user.email ?? '' } })

    // 11. Revalidate
    const eventId = deliverable.event_id
    const partnerId = deliverable.partner_id
    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true, proof: proof as Proof }
  } catch (err) {
    console.error('uploadProofAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to upload proof' }
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteProofAction(
  proofId: string,
  filePath: string,
  deliverableId: string,
  eventId: string,
  partnerId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    // 1. Validate IDs
    if (!isUuid(proofId)) return { ok: false, error: 'Invalid proof ID' }
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    // 2. Auth + role check
    const auth = await getAuthenticatedContext()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canDeleteProof(auth.role)) {
      return { ok: false, error: 'You do not have permission to delete proofs' }
    }

    // 3. Delete from storage (admin client — bypasses RLS)
    const admin = createAdminClient()
    try {
      const storagePath = extractStoragePath(filePath)
      const { error: storageError } = await admin.storage
        .from('proof')
        .remove([storagePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue — orphaned file is less bad than orphaned record
      }
    } catch (pathErr) {
      console.error('Failed to extract storage path:', pathErr)
    }

    // 4. Delete DB record (admin client — bypasses RLS)
    const { error: deleteDbError } = await admin
      .from('proofs')
      .delete()
      .eq('id', proofId)

    if (deleteDbError) {
      console.error('[Proof] DB delete error:', deleteDbError)
      return { ok: false, error: 'Failed to delete proof record' }
    }

    // 5. Revert proved/pending_approval → done if no remaining proofs
    const deliverable = await getDeliverableById(deliverableId)
    if (deliverable && (deliverable.status === 'proved' || deliverable.status === 'pending_approval')) {
      const { data: remaining } = await admin
        .from('proofs')
        .select('id')
        .eq('deliverable_id', deliverableId)

      if (!remaining || remaining.length === 0) {
        await updateDeliverableStatus(deliverableId, 'done')
      }
    }

    // 6. Log activity
    logActivity({ orgId: auth.orgId, userId: auth.user.id, action: 'deleted_proof', targetType: 'proof', targetId: proofId, eventId, details: { partner_id: partnerId, actor_email: auth.user.email ?? '' } })

    // 7. Revalidate
    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('deleteProofAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete proof' }
  }
}

// ---------------------------------------------------------------------------
// Link proof (URL submission)
// ---------------------------------------------------------------------------

export async function submitLinkProofAction(
  deliverableId: string,
  url: string,
): Promise<{ ok: boolean; error?: string; proof?: Proof }> {
  try {
    // 1. Auth
    const auth = await getAuthenticatedContext()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }
    const { user, orgId } = auth

    // 2. Validate inputs
    if (!deliverableId || !isUuid(deliverableId)) {
      return { ok: false, error: 'Invalid deliverable ID' }
    }

    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      return { ok: false, error: 'URL is required' }
    }

    try {
      const parsed = new URL(trimmedUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { ok: false, error: 'URL must start with http:// or https://' }
      }
    } catch {
      return { ok: false, error: 'Invalid URL format' }
    }

    // 3. Verify deliverable exists
    const deliverable = await getDeliverableById(deliverableId)
    if (!deliverable) {
      return { ok: false, error: 'Deliverable not found' }
    }

    // 4. Create DB record
    const admin = createAdminClient()
    let hostname = 'link'
    try { hostname = new URL(trimmedUrl).hostname } catch { /* use default */ }

    const { data: proof, error: dbError } = await admin
      .from('proofs')
      .insert({
        deliverable_id: deliverableId,
        org_id: orgId,
        file_url: trimmedUrl,
        file_name: hostname,
        file_type: 'text/uri-list',
        file_size: 0,
        uploaded_by: user.id,
        validation_status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Proof] Link proof DB insert error:', dbError)
      if (isTableMissingError(dbError)) {
        return {
          ok: false,
          error: 'Proof storage is not fully set up. Run the proofs table migration.',
        }
      }
      return { ok: false, error: 'Failed to save link proof' }
    }

    // 5. Auto-advance status: done → proved (or pending_approval if category requires approval)
    const notifyAdmin = tryCreateAdminClient()
    let orgSettings: OrgSettings | null = null
    if (notifyAdmin) {
      const { data: orgRow } = await notifyAdmin.from('organizations').select('settings').eq('id', orgId).single()
      orgSettings = (orgRow?.settings ?? {}) as OrgSettings
    }

    if (deliverable.status === 'done') {
      const needsApproval = requiresApproval(deliverable.category, orgSettings)
      await updateDeliverableStatus(
        deliverableId,
        needsApproval ? 'pending_approval' : 'proved',
      )

      if (needsApproval && notifyAdmin) {
        notifyOrgAdmins(notifyAdmin, orgId, user.id, {
          type: 'pending_approval',
          title: `${CATEGORY_CONFIG[deliverable.category].label} deliverable pending your approval`,
          body: `"${deliverable.title}" — admin review required`,
          link: `/events/${deliverable.event_id}/partners/${deliverable.partner_id}/deliverables/${deliverableId}`,
        }).catch(() => {})
      }

      if (!needsApproval) {
        fireWebhook('deliverable_proved', orgId, {
          deliverable_id: deliverableId,
          title: deliverable.title,
          category: deliverable.category,
          event_id: deliverable.event_id,
          partner_id: deliverable.partner_id,
        })
      }
    }

    // 6. Notify org admins
    if (notifyAdmin) {
      notifyOrgAdmins(notifyAdmin, orgId, user.id, {
        type: 'proof_uploaded',
        title: `Link proof added for "${deliverable.title}"`,
        body: trimmedUrl,
        link: `/events/${deliverable.event_id}/partners/${deliverable.partner_id}`,
      }).catch(() => {})
    }

    // 7. Log activity
    logActivity({ orgId, userId: user.id, action: 'uploaded_proof', targetType: 'proof', targetId: proof.id, eventId: deliverable.event_id, details: { file_name: hostname, deliverable_title: deliverable.title, partner_id: deliverable.partner_id, actor_email: user.email ?? '' } })

    // 8. Revalidate
    const eventId = deliverable.event_id
    const partnerId = deliverable.partner_id
    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true, proof: proof as Proof }
  } catch (err) {
    console.error('submitLinkProofAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to submit link proof' }
  }
}

// ---------------------------------------------------------------------------
// Admin override — approve or request re-upload
// ---------------------------------------------------------------------------

export async function approveProofAction(
  proofId: string,
  eventId: string,
  partnerId: string,
  deliverableId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(proofId)) return { ok: false, error: 'Invalid proof ID' }

    const auth = await getAuthenticatedContext()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can approve proofs' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('proofs')
      .update({
        validation_status: 'approved',
        validation_result: JSON.stringify({
          valid: true,
          confidence: 'high',
          reason: 'Manually approved by admin',
          issues: [],
        }),
      })
      .eq('id', proofId)

    if (error) {
      console.error('[Proof] Approve error:', error)
      return { ok: false, error: 'Failed to approve proof' }
    }

    logActivity({ orgId: auth.orgId, userId: auth.user.id, action: 'approved_proof', targetType: 'proof', targetId: proofId, eventId, details: { partner_id: partnerId, deliverable_id: deliverableId, actor_email: auth.user.email ?? '' } })

    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('approveProofAction error:', err)
    return { ok: false, error: 'Failed to approve proof' }
  }
}

export async function requestProofReuploadAction(
  proofId: string,
  eventId: string,
  partnerId: string,
  deliverableId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(proofId)) return { ok: false, error: 'Invalid proof ID' }

    const auth = await getAuthenticatedContext()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can request re-uploads' }

    const admin = createAdminClient()

    // Fetch proof to find uploader
    const { data: proof } = await admin
      .from('proofs')
      .select('uploaded_by, file_name')
      .eq('id', proofId)
      .single()

    const { error } = await admin
      .from('proofs')
      .update({
        validation_status: 'reupload_requested',
        validation_result: JSON.stringify({
          valid: false,
          confidence: 'high',
          reason: 'Admin requested a new upload',
          issues: ['Re-upload required'],
        }),
      })
      .eq('id', proofId)

    if (error) {
      console.error('[Proof] Reupload request error:', error)
      return { ok: false, error: 'Failed to request re-upload' }
    }

    // Notify the uploader
    const notifyAdmin = tryCreateAdminClient()
    if (notifyAdmin && proof?.uploaded_by) {
      const deliverable = await getDeliverableById(deliverableId)
      notifyOrgAdmins(notifyAdmin, auth.orgId, auth.user.id, {
        type: 'reupload_requested',
        title: `Re-upload requested for "${deliverable?.title ?? 'deliverable'}"`,
        body: `Admin flagged the proof "${proof.file_name}" for re-upload`,
        link: `/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`,
      }).catch(() => {})
    }

    logActivity({ orgId: auth.orgId, userId: auth.user.id, action: 'requested_proof_reupload', targetType: 'proof', targetId: proofId, eventId, details: { partner_id: partnerId, deliverable_id: deliverableId, actor_email: auth.user.email ?? '' } })

    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('requestProofReuploadAction error:', err)
    return { ok: false, error: 'Failed to request re-upload' }
  }
}
