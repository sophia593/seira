// lib/db/events.ts
// Event CRUD operations

import { handleDbError, type SupabaseClient } from './client'
import type {
  Event,
  EventStatus,
  EventWithCompletion,
  CreateEventInput,
} from '@/lib/types/database'
import { DEFAULT_EVENT_STATUS } from '@/lib/constants'

// =============================================================================
// Read Operations
// =============================================================================

export async function listEvents(
  supabase: SupabaseClient,
  orgId: string,
  options?: {
    status?: EventStatus
    limit?: number
    orderBy?: 'date' | 'created_at' | 'name'
    ascending?: boolean
  }
): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('*')
    .eq('org_id', orgId)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const orderColumn = options?.orderBy ?? 'date'
  query = query.order(orderColumn, {
    ascending: options?.ascending ?? true,
    nullsFirst: false,
  })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    handleDbError(error, 'Failed to list events')
  }

  return (data ?? []) as Event[]
}

export async function getEventById(
  supabase: SupabaseClient,
  eventId: string,
  orgId: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('org_id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get event')
  }

  return data as Event
}

/**
 * Get event with completion stats.
 * Computes deliverable counts via join/aggregation.
 */
export async function getEventWithCompletion(
  supabase: SupabaseClient,
  eventId: string,
  orgId: string
): Promise<EventWithCompletion | null> {
  // Get base event
  const event = await getEventById(supabase, eventId, orgId)
  if (!event) return null

  // Get deliverable stats
  const { data: deliverables, error } = await supabase
    .from('deliverables')
    .select('id, status, due_date')
    .eq('event_id', eventId)

  if (error) {
    handleDbError(error, 'Failed to get event deliverables')
  }

  const items = deliverables ?? []
  const total = items.length
  const completed = items.filter(
    (d) => d.status === 'done' || d.status === 'proved'
  ).length
  const today = new Date().toISOString().split('T')[0]
  const overdue = items.filter(
    (d) =>
      d.due_date &&
      d.due_date < today &&
      d.status !== 'done' &&
      d.status !== 'proved'
  ).length

  return {
    ...event,
    total_deliverables: total,
    completed_deliverables: completed,
    overdue_count: overdue,
    completion_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * List events with completion stats.
 */
export async function listEventsWithCompletion(
  supabase: SupabaseClient,
  orgId: string,
  options?: { status?: EventStatus; limit?: number }
): Promise<EventWithCompletion[]> {
  const events = await listEvents(supabase, orgId, options)

  // For each event, compute completion stats
  const results: EventWithCompletion[] = []

  for (const event of events) {
    const withCompletion = await getEventWithCompletion(supabase, event.id, orgId)
    if (withCompletion) {
      results.push(withCompletion)
    }
  }

  return results
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createEvent(
  supabase: SupabaseClient,
  orgId: string,
  input: CreateEventInput
): Promise<Event> {
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
  supabase: SupabaseClient,
  eventId: string,
  orgId: string,
  updates: Partial<Omit<Event, 'id' | 'org_id' | 'created_at' | 'updated_at'>>
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update event')
  }

  return data as Event
}

export async function deleteEvent(
  supabase: SupabaseClient,
  eventId: string,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('org_id', orgId)

  if (error) {
    handleDbError(error, 'Failed to delete event')
  }
}

export async function updateEventStatus(
  supabase: SupabaseClient,
  eventId: string,
  orgId: string,
  status: EventStatus
): Promise<Event> {
  return updateEvent(supabase, eventId, orgId, { status })
}
