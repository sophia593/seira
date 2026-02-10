'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import {
  createPartner,
  updatePartner,
  deletePartner,
} from '@/lib/db/partners'
import {
  createDeliverable,
  updateDeliverable,
  updateDeliverableStatus,
  deleteDeliverable,
} from '@/lib/db/deliverables'
import type {
  CreatePartnerInput,
  CreateDeliverableInput,
  DeliverableStatus,
} from '@/lib/types/database'

// =============================================================================
// Result type for all actions
// =============================================================================

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

// =============================================================================
// Helper to get authenticated user's org
// =============================================================================

async function getAuthenticatedOrg(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; orgId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const membership = await getUserMembership(supabase as Parameters<typeof getUserMembership>[0], user.id)
  if (!membership) {
    return { error: 'No organization membership' }
  }

  return { supabase, orgId: membership.org_id }
}

// =============================================================================
// Partner Actions
// =============================================================================

export async function createPartnerAction(input: CreatePartnerInput): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    const partner = await createPartner(
      auth.supabase as Parameters<typeof createPartner>[0],
      auth.orgId,
      input
    )

    revalidatePath('/')
    revalidatePath(`/events/${input.event_id}`)

    return { ok: true, data: { id: partner.id } }
  } catch (err) {
    console.error('createPartnerAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create partner' }
  }
}

export async function updatePartnerAction(
  partnerId: string,
  eventId: string,
  updates: Partial<Omit<CreatePartnerInput, 'event_id'>>
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    await updatePartner(
      auth.supabase as Parameters<typeof updatePartner>[0],
      partnerId,
      auth.orgId,
      updates
    )

    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true }
  } catch (err) {
    console.error('updatePartnerAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update partner' }
  }
}

export async function deletePartnerAction(partnerId: string, eventId: string): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    await deletePartner(
      auth.supabase as Parameters<typeof deletePartner>[0],
      partnerId,
      auth.orgId
    )

    revalidatePath('/')
    revalidatePath(`/events/${eventId}`)

    return { ok: true }
  } catch (err) {
    console.error('deletePartnerAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete partner' }
  }
}

// =============================================================================
// Deliverable Actions
// =============================================================================

export async function createDeliverableAction(input: CreateDeliverableInput): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    const deliverable = await createDeliverable(
      auth.supabase as Parameters<typeof createDeliverable>[0],
      input
    )

    revalidatePath('/')
    revalidatePath(`/events/${input.event_id}`)
    revalidatePath(`/events/${input.event_id}/partners/${input.partner_id}`)

    return { ok: true, data: { id: deliverable.id } }
  } catch (err) {
    console.error('createDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create deliverable' }
  }
}

export async function updateDeliverableAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
  updates: Partial<Omit<CreateDeliverableInput, 'partner_id' | 'event_id'>>
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    await updateDeliverable(
      auth.supabase as Parameters<typeof updateDeliverable>[0],
      deliverableId,
      updates
    )

    revalidatePath('/')
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
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    await updateDeliverableStatus(
      auth.supabase as Parameters<typeof updateDeliverableStatus>[0],
      deliverableId,
      newStatus
    )

    revalidatePath('/')
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
): Promise<ActionResult> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    await deleteDeliverable(
      auth.supabase as Parameters<typeof deleteDeliverable>[0],
      deliverableId
    )

    revalidatePath('/')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true }
  } catch (err) {
    console.error('deleteDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete deliverable' }
  }
}
