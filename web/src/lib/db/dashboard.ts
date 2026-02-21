// lib/db/dashboard.ts
// Dashboard data layer — queries Supabase views for stat cards and lists

import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import { countProofByDeliverable } from './proof'
import type {
  Event,
  EventWithCompletion,
  DeliverableWithPartner,
  Deliverable,
  DeliverableCategory,
  DeliverableStatus,
} from '@/lib/types/database'

// =============================================================================
// Types
// =============================================================================

export interface DashboardStats {
  activeEvents: number
  totalDeliverables: number
  overdueCount: number
  completionPct: number
}

export interface DashboardFilters {
  eventId?: string
  seasonId?: string
  partnerName?: string
  category?: DeliverableCategory
  status?: DeliverableStatus
}

// =============================================================================
// Filter helpers
// =============================================================================

/**
 * Resolve the set of event IDs matching event/season filters.
 * Returns null when no event-level filter is applied (meaning "all events").
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveFilteredEventIds(client: any, orgId: string, filters: DashboardFilters): Promise<string[] | null> {
  if (!filters.eventId && !filters.seasonId) return null

  if (filters.eventId) return [filters.eventId]

  const { data, error } = await client
    .from('events')
    .select('id')
    .eq('org_id', orgId)
    .eq('season_id', filters.seasonId!)
    .neq('status', 'archived')

  if (error) handleDbError(error, 'Failed to resolve season events')
  return (data ?? []).map((e: { id: string }) => e.id)
}

/** Resolve partner IDs matching a partner name filter (case-insensitive). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolvePartnerIds(client: any, orgId: string, partnerName: string, eventIds?: string[]): Promise<string[]> {
  let query = client
    .from('partners')
    .select('id')
    .eq('org_id', orgId)
    .ilike('name', partnerName)

  if (eventIds) {
    query = query.in('event_id', eventIds)
  }

  const { data, error } = await query
  if (error) handleDbError(error, 'Failed to resolve partner IDs')
  return (data ?? []).map((p: { id: string }) => p.id)
}

// =============================================================================
// Stat cards
// =============================================================================

/** Aggregate stats across non-archived events for the org. */
export async function getDashboardStats(orgId: string, filters?: DashboardFilters): Promise<DashboardStats> {
  const supabase = await createClient()

  // 1. All non-archived events for this org
  let eventQuery = supabase
    .from('events')
    .select('id, status')
    .eq('org_id', orgId)
    .neq('status', 'archived')

  if (filters?.eventId) eventQuery = eventQuery.eq('id', filters.eventId)
  if (filters?.seasonId) eventQuery = eventQuery.eq('season_id', filters.seasonId)

  const { data: events, error: eventError } = await eventQuery

  if (eventError) handleDbError(eventError, 'Failed to load dashboard stats')
  if (!events || events.length === 0) {
    return { activeEvents: 0, totalDeliverables: 0, overdueCount: 0, completionPct: 0 }
  }

  const activeEvents = events.filter(
    (e) => e.status === 'upcoming' || e.status === 'active'
  ).length

  // 2. All deliverables for those events
  const eventIds = events.map((e) => e.id)
  let delQuery = supabase
    .from('deliverables')
    .select('id, event_id, status, due_date, category, partner_id')
    .in('event_id', eventIds)

  if (filters?.category) delQuery = delQuery.eq('category', filters.category)
  if (filters?.status) delQuery = delQuery.eq('status', filters.status)

  if (filters?.partnerName) {
    const partnerIds = await resolvePartnerIds(supabase, orgId, filters.partnerName, eventIds)
    if (partnerIds.length === 0) {
      return { activeEvents: 0, totalDeliverables: 0, overdueCount: 0, completionPct: 0 }
    }
    delQuery = delQuery.in('partner_id', partnerIds)
  }

  const { data: deliverables, error: delError } = await delQuery

  if (delError) handleDbError(delError, 'Failed to load deliverables for dashboard stats')

  const today = new Date(new Date().toDateString())
  let totalDeliverables = 0
  let completedDeliverables = 0
  let overdueCount = 0

  for (const d of deliverables ?? []) {
    totalDeliverables++
    if (d.status === 'done' || d.status === 'proved') completedDeliverables++
    if (d.due_date && d.status !== 'done' && d.status !== 'proved' && new Date(d.due_date) < today) {
      overdueCount++
    }
  }

  return {
    activeEvents,
    totalDeliverables,
    overdueCount,
    completionPct: totalDeliverables > 0
      ? Math.round((completedDeliverables / totalDeliverables) * 100)
      : 0,
  }
}

// =============================================================================
// Upcoming events list
// =============================================================================

/** Up to 5 upcoming/active events with completion data, ordered by date asc. */
export async function getUpcomingEvents(orgId: string, filters?: DashboardFilters): Promise<EventWithCompletion[]> {
  const supabase = await createClient()

  // 1. Events query — scope by filter
  let eventQuery = supabase.from('events').select('*').eq('org_id', orgId)

  if (filters?.eventId) {
    // Show the specific event regardless of status
    eventQuery = eventQuery.eq('id', filters.eventId)
  } else {
    eventQuery = eventQuery.in('status', ['upcoming', 'active'])
    if (filters?.seasonId) eventQuery = eventQuery.eq('season_id', filters.seasonId)
  }

  eventQuery = eventQuery.order('date', { ascending: true, nullsFirst: false }).limit(5)

  const { data: events, error: eventError } = await eventQuery

  if (eventError) handleDbError(eventError, 'Failed to load upcoming events')
  if (!events || events.length === 0) return []

  // 2. Deliverables for those events
  const eventIds = events.map((e) => e.id)
  let delQuery = supabase
    .from('deliverables')
    .select('id, event_id, status, due_date, category, partner_id')
    .in('event_id', eventIds)

  if (filters?.category) delQuery = delQuery.eq('category', filters.category)
  if (filters?.status) delQuery = delQuery.eq('status', filters.status)

  if (filters?.partnerName) {
    const partnerIds = await resolvePartnerIds(supabase, orgId, filters.partnerName, eventIds)
    if (partnerIds.length === 0) {
      return (events as Event[]).map((e) => ({
        ...e,
        total_deliverables: 0,
        completed_deliverables: 0,
        overdue_count: 0,
        completion_pct: 0,
      }))
    }
    delQuery = delQuery.in('partner_id', partnerIds)
  }

  const { data: deliverables, error: delError } = await delQuery

  if (delError) handleDbError(delError, 'Failed to load deliverables for upcoming events')

  // 3. Compute per-event stats
  const today = new Date(new Date().toDateString())
  const stats: Record<string, { total: number; completed: number; overdue: number }> = {}
  const doneIdsByEvent = new Map<string, string[]>()

  for (const d of deliverables ?? []) {
    const entry = stats[d.event_id] ?? { total: 0, completed: 0, overdue: 0 }
    entry.total++
    if (d.status === 'done' || d.status === 'proved') entry.completed++
    if (d.due_date && d.status !== 'done' && d.status !== 'proved' && new Date(d.due_date) < today) {
      entry.overdue++
    }
    stats[d.event_id] = entry

    // Track "done" (not "proved") deliverables for needs-proof count
    if (d.status === 'done') {
      const arr = doneIdsByEvent.get(d.event_id) ?? []
      arr.push(d.id)
      doneIdsByEvent.set(d.event_id, arr)
    }
  }

  // 4. Count proofs for "done" deliverables to determine needs_proof_count
  const allDoneIds = [...doneIdsByEvent.values()].flat()
  const proofCounts = allDoneIds.length > 0 ? await countProofByDeliverable(allDoneIds) : {}

  return (events as Event[]).map((e) => {
    const s = stats[e.id] ?? { total: 0, completed: 0, overdue: 0 }
    const doneIds = doneIdsByEvent.get(e.id) ?? []
    const needsProofCount = doneIds.filter((id) => (proofCounts[id] ?? 0) === 0).length
    return {
      ...e,
      total_deliverables: s.total,
      completed_deliverables: s.completed,
      overdue_count: s.overdue,
      completion_pct: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      needs_proof_count: needsProofCount,
    }
  })
}

// =============================================================================
// Overdue deliverables list
// =============================================================================

/** Up to 10 overdue deliverables with partner name, across all org events. */
export async function getOverdueDeliverables(orgId: string, filters?: DashboardFilters): Promise<DeliverableWithPartner[]> {
  // Overdue only applies to incomplete statuses
  if (filters?.status === 'done' || filters?.status === 'proved') return []

  const supabase = await createClient()

  // Resolve event IDs
  const filteredEventIds = filters ? await resolveFilteredEventIds(supabase, orgId, filters) : null

  let eventIds: string[]
  if (filteredEventIds) {
    if (filteredEventIds.length === 0) return []
    eventIds = filteredEventIds
  } else {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('org_id', orgId)
      .neq('status', 'archived')

    if (eventsError) handleDbError(eventsError, 'Failed to load org events for overdue')
    if (!events || events.length === 0) return []
    eventIds = events.map((e) => e.id)
  }

  const today = new Date().toISOString().split('T')[0]

  let delQuery = supabase
    .from('deliverables')
    .select('*, partners!inner(id, name)')
    .in('event_id', eventIds)
    .lt('due_date', today)
    .order('due_date', { ascending: true })
    .limit(10)

  // Status filter
  if (filters?.status) {
    delQuery = delQuery.eq('status', filters.status)
  } else {
    delQuery = delQuery.in('status', ['not_started', 'in_progress'])
  }

  if (filters?.category) delQuery = delQuery.eq('category', filters.category)

  if (filters?.partnerName) {
    const partnerIds = await resolvePartnerIds(supabase, orgId, filters.partnerName, eventIds)
    if (partnerIds.length === 0) return []
    delQuery = delQuery.in('partner_id', partnerIds)
  }

  const { data, error } = await delQuery

  if (error) handleDbError(error, 'Failed to load overdue deliverables')

  return (data ?? []).map((row) => {
    const { partners, ...deliverable } = row as Deliverable & { partners: { id: string; name: string } }
    return { ...deliverable, partner: partners } as DeliverableWithPartner
  })
}

// =============================================================================
// Needs-proof deliverables list
// =============================================================================

/** Up to 10 deliverables with status 'done' and zero proofs, with partner name. */
export async function getNeedsProofDeliverables(orgId: string, filters?: DashboardFilters): Promise<DeliverableWithPartner[]> {
  // Needs-proof only applies to 'done' status
  if (filters?.status && filters.status !== 'done') return []

  const supabase = await createClient()

  // Resolve event IDs
  const filteredEventIds = filters ? await resolveFilteredEventIds(supabase, orgId, filters) : null

  let eventIds: string[]
  if (filteredEventIds) {
    if (filteredEventIds.length === 0) return []
    eventIds = filteredEventIds
  } else {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('org_id', orgId)
      .neq('status', 'archived')

    if (eventsError) handleDbError(eventsError, 'Failed to load org events for needs-proof')
    if (!events || events.length === 0) return []
    eventIds = events.map((e) => e.id)
  }

  let delQuery = supabase
    .from('deliverables')
    .select('*, partners!inner(id, name)')
    .in('event_id', eventIds)
    .eq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filters?.category) delQuery = delQuery.eq('category', filters.category)

  if (filters?.partnerName) {
    const partnerIds = await resolvePartnerIds(supabase, orgId, filters.partnerName, eventIds)
    if (partnerIds.length === 0) return []
    delQuery = delQuery.in('partner_id', partnerIds)
  }

  const { data, error } = await delQuery

  if (error) handleDbError(error, 'Failed to load needs-proof deliverables')

  const rows = (data ?? []).map((row) => {
    const { partners, ...deliverable } = row as Deliverable & { partners: { id: string; name: string } }
    return { ...deliverable, partner: partners } as DeliverableWithPartner
  })

  if (rows.length === 0) return []

  // Filter to only deliverables with zero actual proofs
  const proofCounts = await countProofByDeliverable(rows.map((r) => r.id))
  return rows.filter((r) => (proofCounts[r.id] ?? 0) === 0).slice(0, 10)
}

// =============================================================================
// Deliverables by category
// =============================================================================

export interface CategoryBreakdown {
  category: DeliverableCategory
  total: number
  completed: number
  pct: number
}

/** Aggregate deliverable counts grouped by category for the org. */
export async function getDeliverablesByCategory(orgId: string): Promise<CategoryBreakdown[]> {
  const supabase = await createClient()

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .eq('org_id', orgId)
    .neq('status', 'archived')

  if (eventsError) handleDbError(eventsError, 'Failed to load events for category breakdown')
  if (!events || events.length === 0) return []

  const eventIds = events.map((e) => e.id)

  const { data: deliverables, error: delError } = await supabase
    .from('deliverables')
    .select('category, status')
    .in('event_id', eventIds)

  if (delError) handleDbError(delError, 'Failed to load deliverables for category breakdown')

  const buckets: Record<string, { total: number; completed: number }> = {}
  for (const d of deliverables ?? []) {
    const entry = buckets[d.category] ?? { total: 0, completed: 0 }
    entry.total++
    if (d.status === 'done' || d.status === 'proved') entry.completed++
    buckets[d.category] = entry
  }

  return Object.entries(buckets)
    .map(([category, { total, completed }]) => ({
      category: category as DeliverableCategory,
      total,
      completed,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

// =============================================================================
// Upcoming renewals
// =============================================================================

export interface UpcomingRenewal {
  partner_name: string
  renewal_date: string
  event_name: string
  event_id: string
  partner_id: string
  deal_value: number | null
}

/** Partners with renewal dates in the next N days, deduplicated by name. */
export async function getUpcomingRenewals(
  orgId: string,
  daysAhead: number = 90,
  filters?: DashboardFilters,
): Promise<UpcomingRenewal[]> {
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const futureDate = new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10)

  const filteredEventIds = filters ? await resolveFilteredEventIds(supabase, orgId, filters) : null

  let query = supabase
    .from('partners')
    .select('id, name, renewal_date, deal_value, event_id, events!inner(name)')
    .eq('org_id', orgId)
    .gte('renewal_date', today)
    .lte('renewal_date', futureDate)
    .order('renewal_date', { ascending: true })
    .limit(30)

  if (filteredEventIds) {
    if (filteredEventIds.length === 0) return []
    query = query.in('event_id', filteredEventIds)
  }

  if (filters?.partnerName) {
    query = query.ilike('name', filters.partnerName)
  }

  const { data, error } = await query
  if (error) handleDbError(error, 'Failed to load upcoming renewals')

  // Deduplicate by partner name (show earliest renewal per partner)
  const seen = new Map<string, UpcomingRenewal>()
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const key = (row.name as string).toLowerCase().trim()
    if (!seen.has(key)) {
      const event = (Array.isArray(row.events) ? row.events[0] : row.events) as { name: string } | null
      seen.set(key, {
        partner_name: row.name as string,
        renewal_date: row.renewal_date as string,
        event_name: event?.name ?? '',
        event_id: row.event_id as string,
        partner_id: row.id as string,
        deal_value: row.deal_value as number | null,
      })
    }
  }
  return [...seen.values()]
}
