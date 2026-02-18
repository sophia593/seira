'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import {
  createDeliverable,
  updateDeliverable,
  updateDeliverableStatus,
  deleteDeliverable,
} from '@/lib/db/deliverables'
import { isUuid } from '@/lib/validation'
import { canEditContent, canManageContent } from '@/lib/permissions'
import type { DeliverableCategory, DeliverableStatus, OrgRole, ProofRequired } from '@/lib/types/database'
import { CATEGORIES, STATUS_FLOW, PROOF_REQUIRED_OPTIONS } from '@/lib/constants'

async function getAuthenticatedOrg() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) {
    return { error: 'No organization membership' }
  }

  return { orgId: membership.org_id, role: membership.role as OrgRole }
}

function str(formData: FormData, key: string): string | undefined {
  const val = formData.get(key)
  if (typeof val !== 'string' || val.trim() === '') return undefined
  return val.trim()
}

export async function createDeliverableAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const partnerId = str(formData, 'partner_id')
    if (!partnerId || !isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const eventId = str(formData, 'event_id')
    if (!eventId || !isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const title = str(formData, 'title')
    if (!title) return { ok: false, error: 'Title is required' }

    const category = str(formData, 'category') as DeliverableCategory | undefined
    if (!category || !CATEGORIES.includes(category)) {
      return { ok: false, error: 'Valid category is required' }
    }

    const proofRequired = str(formData, 'proof_required') as ProofRequired | undefined
    if (proofRequired && !PROOF_REQUIRED_OPTIONS.includes(proofRequired)) {
      return { ok: false, error: 'Invalid proof required type' }
    }

    const deliverable = await createDeliverable({
      partner_id: partnerId,
      event_id: eventId,
      title,
      category,
      due_date: str(formData, 'due_date'),
      proof_required: proofRequired,
      notes: str(formData, 'notes'),
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true, id: deliverable.id }
  } catch (err) {
    console.error('createDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create deliverable' }
  }
}

export async function updateDeliverableAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const title = str(formData, 'title')
    if (!title) return { ok: false, error: 'Title is required' }

    const category = str(formData, 'category') as DeliverableCategory | undefined
    if (!category || !CATEGORIES.includes(category)) {
      return { ok: false, error: 'Valid category is required' }
    }

    const proofRequired = str(formData, 'proof_required') as ProofRequired | undefined
    if (proofRequired && !PROOF_REQUIRED_OPTIONS.includes(proofRequired)) {
      return { ok: false, error: 'Invalid proof required type' }
    }

    await updateDeliverable(deliverableId, {
      title,
      category,
      due_date: str(formData, 'due_date'),
      proof_required: proofRequired,
      notes: str(formData, 'notes'),
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true }
  } catch (err) {
    console.error('updateDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update deliverable' }
  }
}

export async function advanceDeliverableStatusAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
  newStatus: DeliverableStatus
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    if (!STATUS_FLOW.includes(newStatus)) {
      return { ok: false, error: 'Invalid status' }
    }

    await updateDeliverableStatus(deliverableId, newStatus)

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true }
  } catch (err) {
    console.error('advanceDeliverableStatusAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update status' }
  }
}

export async function deleteDeliverableAction(
  deliverableId: string,
  eventId: string,
  partnerId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    await deleteDeliverable(deliverableId)

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true }
  } catch (err) {
    console.error('deleteDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete deliverable' }
  }
}
