'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserMembership } from '@/lib/db/client'
import { getDeliverableById, updateDeliverableStatus } from '@/lib/db/deliverables'
import { isUuid } from '@/lib/validation'
import {
  isAllowedProofType,
  MAX_PROOF_SIZE,
  ALLOWED_PROOF_TYPES,
  buildStoragePath,
  extractStoragePath,
} from '@/lib/proof-utils'
import type { Proof } from '@/lib/types/database'

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

  return { supabase, user, orgId: membership.org_id }
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

    // 4. Verify deliverable exists
    const deliverable = await getDeliverableById(deliverableId)
    if (!deliverable) {
      return { ok: false, error: 'Deliverable not found' }
    }

    // 5. Upload to Supabase Storage (admin client — bypasses RLS)
    const admin = createAdminClient()
    const storagePath = buildStoragePath(orgId, deliverableId, file.name)

    const { error: uploadError } = await admin.storage
      .from('proof')
      .upload(storagePath, file, {
        contentType: file.type,
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
          .upload(storagePath, file, {
            contentType: file.type,
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
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
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

    // 8. Auto-advance status: done → proved
    if (deliverable.status === 'done') {
      await updateDeliverableStatus(deliverableId, 'proved')
    }

    // 9. Revalidate
    const eventId = deliverable.event_id
    const partnerId = deliverable.partner_id
    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

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

    // 2. Auth
    const auth = await getAuthenticatedContext()
    if ('error' in auth) return { ok: false, error: auth.error }

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

    // 5. Revert proved → done if no remaining proofs
    const deliverable = await getDeliverableById(deliverableId)
    if (deliverable && deliverable.status === 'proved') {
      const { data: remaining } = await admin
        .from('proofs')
        .select('id')
        .eq('deliverable_id', deliverableId)

      if (!remaining || remaining.length === 0) {
        await updateDeliverableStatus(deliverableId, 'done')
      }
    }

    // 6. Revalidate
    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true }
  } catch (err) {
    console.error('deleteProofAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete proof' }
  }
}
