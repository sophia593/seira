'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createEvent, updateEvent, deleteEvent } from '@/lib/db/events'
import { listPartnersByEvent } from '@/lib/db/partners'
import { listDeliverablesByEvent } from '@/lib/db/deliverables'
import { isUuid } from '@/lib/validation'
import { canManageContent } from '@/lib/permissions'
import { logActivity } from '@/lib/db/activity-log'
import type { EventStatus, OrgRole } from '@/lib/types/database'

const VALID_STATUSES: EventStatus[] = ['upcoming', 'active', 'completed', 'archived']

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

  return { orgId: membership.org_id, role: membership.role as OrgRole, userId: user.id, userEmail: user.email ?? '' }
}

function str(formData: FormData, key: string): string | undefined {
  const val = formData.get(key)
  if (typeof val !== 'string' || val.trim() === '') return undefined
  return val.trim()
}

export async function createEventAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Event name is required' }

    const seasonId = str(formData, 'season_id')

    const event = await createEvent(auth.orgId, {
      name,
      date: str(formData, 'date'),
      venue: str(formData, 'venue'),
      notes: str(formData, 'notes'),
      season_id: seasonId || null,
    })

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'created', targetType: 'event', targetId: event.id, details: { name, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/seasons')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${event.id}`)

    return { ok: true, id: event.id }
  } catch (err) {
    console.error('createEventAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create event' }
  }
}

export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Event name is required' }

    const statusRaw = str(formData, 'status')
    const status = statusRaw && VALID_STATUSES.includes(statusRaw as EventStatus)
      ? (statusRaw as EventStatus)
      : undefined

    const seasonId = str(formData, 'season_id')

    await updateEvent(eventId, {
      name,
      date: str(formData, 'date'),
      venue: str(formData, 'venue'),
      status,
      notes: str(formData, 'notes'),
      season_id: seasonId ?? null,
    })

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'updated', targetType: 'event', targetId: eventId, eventId, details: { name, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/seasons')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)

    return { ok: true }
  } catch (err) {
    console.error('updateEventAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update event' }
  }
}

export async function deleteEventAction(
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    await deleteEvent(eventId)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'deleted', targetType: 'event', targetId: eventId, details: { actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')

    return { ok: true }
  } catch (err) {
    console.error('deleteEventAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete event' }
  }
}

export async function duplicateEventAction(
  sourceEventId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    if (!isUuid(sourceEventId)) return { ok: false, error: 'Invalid event ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Event name is required' }

    const supabase = await createClient()

    // Fetch source event
    const { data: sourceEvent, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', sourceEventId)
      .single()
    if (eventErr || !sourceEvent) return { ok: false, error: 'Source event not found' }

    // Create new event
    const newEvent = await createEvent(auth.orgId, {
      name,
      date: str(formData, 'date') ?? undefined,
      venue: sourceEvent.venue ?? undefined,
      notes: sourceEvent.notes ?? undefined,
    })

    // Fetch all partners and deliverables from source
    const [partners, deliverables] = await Promise.all([
      listPartnersByEvent(sourceEventId),
      listDeliverablesByEvent(sourceEventId),
    ])

    // Create partners and build old→new ID map
    const partnerIdMap = new Map<string, string>()
    for (const p of partners) {
      const { data: newPartner, error: pErr } = await supabase
        .from('partners')
        .insert({
          org_id: auth.orgId,
          event_id: newEvent.id,
          name: p.name,
          contact_name: p.contact_name,
          contact_email: p.contact_email,
          contract_notes: p.contract_notes,
        })
        .select('id')
        .single()
      if (pErr || !newPartner) continue
      partnerIdMap.set(p.id, newPartner.id)
    }

    // Bulk-insert deliverables with fresh statuses
    const deliverableRows = deliverables
      .filter((d) => partnerIdMap.has(d.partner_id))
      .map((d) => ({
        partner_id: partnerIdMap.get(d.partner_id)!,
        event_id: newEvent.id,
        title: d.title,
        category: d.category,
        due_date: d.due_date,
        owner_id: d.owner_id,
        status: 'not_started' as const,
        proof_required: d.proof_required,
        notes: d.notes,
      }))

    if (deliverableRows.length > 0) {
      await supabase.from('deliverables').insert(deliverableRows)
    }

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'duplicated', targetType: 'event', targetId: newEvent.id, details: { name, source_id: sourceEventId, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${newEvent.id}`)

    return { ok: true, id: newEvent.id }
  } catch (err) {
    console.error('duplicateEventAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to duplicate event' }
  }
}
