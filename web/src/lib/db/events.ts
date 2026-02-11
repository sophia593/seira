import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type { Event, EventWithCompletion, CreateEventInput } from '@/lib/types/database'
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

/** List all events for an org with completion stats and partner counts. */
export async function listEventsWithCompletion(orgId: string) {
  const supabase = await createClient()

  // Completion stats from the view
  const { data: eventRows, error: eventError } = await supabase
    .from('event_completion')
    .select('*')
    .eq('org_id', orgId)
    .order('date', { ascending: true, nullsFirst: false })

  if (eventError) handleDbError(eventError, 'Failed to list events with completion')

  const events = (eventRows ?? []) as EventWithCompletion[]

  // Partner counts per event
  const { data: partnerRows, error: partnerError } = await supabase
    .from('partners')
    .select('id, event_id')
    .eq('org_id', orgId)

  if (partnerError) handleDbError(partnerError, 'Failed to count partners')

  const partnerCounts: Record<string, number> = {}
  for (const row of partnerRows ?? []) {
    partnerCounts[row.event_id] = (partnerCounts[row.event_id] ?? 0) + 1
  }

  return events.map((e) => ({
    ...e,
    partner_count: partnerCounts[e.id] ?? 0,
  }))
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
