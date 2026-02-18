import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import { countProofByDeliverable } from './proof'
import type { Event, CreateEventInput } from '@/lib/types/database'
import { DEFAULT_EVENT_STATUS } from '@/lib/constants'

// =============================================================================
// Read Operations
// =============================================================================

export async function listEvents(orgId: string): Promise<Event[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('org_id', orgId)
    .order('date', { ascending: true, nullsFirst: false })

  if (error) {
    handleDbError(error, 'Failed to list events')
  }

  return (data ?? []) as Event[]
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get event')
  }

  return data as Event
}

/** List all events for an org with completion stats and partner counts.
 *  Computes everything in JS from the events, deliverables, and partners tables. */
export async function listEventsWithCompletion(orgId: string) {
  const supabase = await createClient()

  // 1. All events for this org
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('org_id', orgId)
    .order('date', { ascending: true, nullsFirst: false })

  if (eventError) handleDbError(eventError, 'Failed to list events')
  if (!events || events.length === 0) return []

  const eventIds = events.map((e) => e.id)

  // 2. All deliverables for those events (lightweight select)
  const { data: deliverables, error: delError } = await supabase
    .from('deliverables')
    .select('id, event_id, status, due_date')
    .in('event_id', eventIds)

  if (delError) handleDbError(delError, 'Failed to fetch deliverables for events')

  // 3. All partners for this org
  const { data: partners, error: partnerError } = await supabase
    .from('partners')
    .select('id, event_id')
    .eq('org_id', orgId)

  if (partnerError) handleDbError(partnerError, 'Failed to count partners')

  // 4. Compute per-event stats in JS
  const today = new Date(new Date().toDateString())

  const delStats: Record<string, { total: number; completed: number; overdue: number }> = {}
  const doneDeliverableIds: string[] = []
  const doneByEvent: Record<string, string[]> = {}

  for (const d of deliverables ?? []) {
    const entry = delStats[d.event_id] ?? { total: 0, completed: 0, overdue: 0 }
    entry.total++
    if (d.status === 'done' || d.status === 'proved') entry.completed++
    if (d.due_date && d.status !== 'done' && d.status !== 'proved' && new Date(d.due_date) < today) {
      entry.overdue++
    }
    if (d.status === 'done') {
      doneDeliverableIds.push(d.id)
      if (!doneByEvent[d.event_id]) doneByEvent[d.event_id] = []
      doneByEvent[d.event_id].push(d.id)
    }
    delStats[d.event_id] = entry
  }

  const partnerCounts: Record<string, number> = {}
  for (const p of partners ?? []) {
    partnerCounts[p.event_id] = (partnerCounts[p.event_id] ?? 0) + 1
  }

  // 5. Compute needs_proof_count: done deliverables with zero proofs
  const proofCounts = doneDeliverableIds.length > 0
    ? await countProofByDeliverable(doneDeliverableIds)
    : {}

  return (events as Event[]).map((e) => {
    const stats = delStats[e.id] ?? { total: 0, completed: 0, overdue: 0 }
    const doneIds = doneByEvent[e.id] ?? []
    const needsProofCount = doneIds.filter((id) => (proofCounts[id] ?? 0) === 0).length
    return {
      ...e,
      total_deliverables: stats.total,
      completed_deliverables: stats.completed,
      overdue_count: stats.overdue,
      completion_pct: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      partner_count: partnerCounts[e.id] ?? 0,
      needs_proof_count: needsProofCount,
    }
  })
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createEvent(
  orgId: string,
  input: CreateEventInput
): Promise<Event> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .insert({
      org_id: orgId,
      name: input.name,
      date: input.date ?? null,
      venue: input.venue ?? null,
      status: input.status ?? DEFAULT_EVENT_STATUS,
      notes: input.notes ?? null,
      season_id: input.season_id ?? null,
    })
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to create event')
  }

  return data as Event
}

export async function updateEvent(
  eventId: string,
  input: Partial<CreateEventInput>
): Promise<Event> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.date !== undefined) updates.date = input.date || null
  if (input.venue !== undefined) updates.venue = input.venue || null
  if (input.status !== undefined) updates.status = input.status
  if (input.notes !== undefined) updates.notes = input.notes || null
  if (input.season_id !== undefined) updates.season_id = input.season_id || null

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update event')
  }

  return data as Event
}

export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    handleDbError(error, 'Failed to delete event')
  }
}
