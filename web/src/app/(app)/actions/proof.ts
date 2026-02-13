'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createProofRecord, deleteProofRecord, listProofByDeliverable } from '@/lib/db/proof'
import { getDeliverableById, updateDeliverableStatus } from '@/lib/db/deliverables'
import { isUuid } from '@/lib/validation'
import {
  isAllowedProofType,
  MAX_PROOF_SIZE,
  buildStoragePath,
  extractStoragePath,
} from '@/lib/proof-utils'
import type { Proof } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Auth helper — returns supabase client for storage operations
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
// Upload
// ---------------------------------------------------------------------------

export async function uploadProofAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; proof?: Proof }> {
  try {
    // 1. Auth
    const auth = await getAuthenticatedContext()
    if ('error' in auth) return { ok: false, error: auth.error }
    const { supabase, user, orgId } = auth

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

    // 5. Upload to Supabase Storage
    const storagePath = buildStoragePath(orgId, deliverableId, file.name)

    const { error: uploadError } = await supabase.storage
      .from('proof')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { ok: false, error: 'Failed to upload file' }
    }

    // 6. Get public URL
    const { data: urlData } = supabase.storage
      .from('proof')
      .getPublicUrl(storagePath)

    // 7. Create DB record
    const proof = await createProofRecord({
      deliverable_id: deliverableId,
      org_id: orgId,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: user.id,
    })

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

    return { ok: true, proof }
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
    const { supabase } = auth

    // 3. Delete from storage
    try {
      const storagePath = extractStoragePath(filePath)
      const { error: storageError } = await supabase.storage
        .from('proof')
        .remove([storagePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue — orphaned file is less bad than orphaned record
      }
    } catch (pathErr) {
      console.error('Failed to extract storage path:', pathErr)
    }

    // 4. Delete DB record
    await deleteProofRecord(proofId)

    // 5. Revert proved → done if no remaining proofs
    const deliverable = await getDeliverableById(deliverableId)
    if (deliverable && deliverable.status === 'proved') {
      const remaining = await listProofByDeliverable(deliverableId)
      if (remaining.length === 0) {
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
