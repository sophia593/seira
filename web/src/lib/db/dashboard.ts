// lib/db/dashboard.ts
// Dashboard data layer — queries Supabase views for stat cards and lists

import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import { countProofByDeliverable } from './proof'
import { startTimer } from '@/lib/perf'
import { isDeliverableCompleted } from '@/lib/constants'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

/**
 * Shared context for dashboard queries — avoids creating multiple Supabase
 * clients and re-querying the events table in every function.
 */
export interface DashboardContext {
  supabase: SupabaseClient
  orgId: string
  filters: DashboardFilters
  /** Pre-resolved event IDs matching event/season filters, or null = all */
  filteredEventIds: string[] | null
  /** All non-archived event IDs for the org (fetched once). */
  orgEventIds: string[]
}

/**
 * Create a shared DashboardContext — one `createClient()` call, one events
 * query — then pass `ctx` to every dashboard function.
 */
export async function createDashboardContext(
  orgId: string,
  filters?: DashboardFilters,
): Promise<DashboardContext> {
  const supabase = await createClient()
  const f = filters ?? {}

  // 1. All non-archived event IDs (shared by stats, overdue, needs-proof, etc.)
  const { data: allEvents } = await supabase
    .from('events')
    .select('id')
    .eq('org_id', orgId)
    .neq('status', 'archived')

  const orgEventIds = (allEvents ?? []).map((e: { id: string }) => e.id)

  // 2. Resolve filtered event IDs if event/season filter is active
  const filteredEventIds = await resolveFilteredEventIds(supabase, orgId, f)

  return { supabase, orgId, filters: f, filteredEventIds, orgEventIds }
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
export async function getDashboardStats(ctx: DashboardContext): Promise<DashboardStats>
export async function getDashboardStats(orgId: string, filters?: DashboardFilters): Promise<DashboardStats>
export async function getDashboardStats(orgIdOrCtx: string | DashboardContext, filters?: DashboardFilters): Promise<DashboardStats> {
  const timer = startTimer('getDashboardStats')

  // Resolve context
  const ctx = typeof orgIdOrCtx === 'string'
    ? await createDashboardContext(orgIdOrCtx, filters)
    : orgIdOrCtx
  const { supabase, orgId, filters: f } = ctx

  // Use pre-resolved event IDs — skip the events query entirely
  let eventIds = f.eventId || f.seasonId ? ctx.filteredEventIds ?? [] : ctx.orgEventIds
  if (eventIds.length === 0) {
    timer.end()
    return { activeEvents: 0, totalDeliverables: 0, overdueCount: 0, completionPct: 0 }
  }

  // We need statuses to count active events, so fetch status for our scoped event IDs
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, status')
    .in('id', eventIds)

  if (eventError) handleDbError(eventError, 'Failed to load dashboard stats')

  const activeEvents = (events ?? []).filter(
    (e: { status: string }) => e.status === 'upcoming' || e.status === 'active'
  ).length
  eventIds = (events ?? []).map((e: { id: string }) => e.id)

  // 2. All deliverables for those events
  let delQuery = supabase
    .from('deliverables')
    .select('id, event_id, status, due_date, category, partner_id')
    .in('event_id', eventIds)

  if (f.category) delQuery = delQuery.eq('category', f.category)
  if (f.status) delQuery = delQuery.eq('status', f.status)

  if (f.partnerName) {
    const partnerIds = await resolvePartnerIds(supabase, orgId, f.partnerName, eventIds)
    if (partnerIds.length === 0) {
      timer.end()
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
    if (isDeliverableCompleted(d.status)) completedDeliverables++
    if (d.due_date && !isDeliverableCompleted(d.status) && new Date(d.due_date) < today) {
      overdueCount++
    }
  }

  timer.end()
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
export async function getUpcomingEvents(ctx: DashboardContext): Promise<EventWithCompletion[]>
export async function getUpcomingEvents(orgId: string, filters?: DashboardFilters): Promise<EventWithCompletion[]>
export async function getUpcomingEvents(orgIdOrCtx: string | DashboardContext, filters?: DashboardFilters): Promise<EventWithCompletion[]> {
  const timer = startTimer('getUpcomingEvents')
  const ctx = typeof orgIdOrCtx === 'string'
    ? await createDashboardContext(orgIdOrCtx, filters)
    : orgIdOrCtx
  const { supabase, orgId, filters: f } = ctx
  // Re-alias filters for the rest of the function
  filters = f

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
  const eventIds = (events ?? []).map((e: { id: string }) => e.id)
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
    if (isDeliverableCompleted(d.status)) entry.completed++
    if (d.due_date && !isDeliverableCompleted(d.status) && new Date(d.due_date) < today) {
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

  timer.end()
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
export async function getOverdueDeliverables(ctx: DashboardContext): Promise<DeliverableWithPartner[]>
export async function getOverdueDeliverables(orgId: string, filters?: DashboardFilters): Promise<DeliverableWithPartner[]>
export async function getOverdueDeliverables(orgIdOrCtx: string | DashboardContext, filters?: DashboardFilters): Promise<DeliverableWithPartner[]> {
  const ctx = typeof orgIdOrCtx === 'string'
    ? await createDashboardContext(orgIdOrCtx, filters)
    : orgIdOrCtx
  const { supabase, orgId, filters: f } = ctx

  // Overdue only applies to incomplete statuses
  if (f.status && isDeliverableCompleted(f.status)) return []

  // Use pre-resolved event IDs from context
  const eventIds = f.eventId || f.seasonId
    ? (ctx.filteredEventIds ?? [])
    : ctx.orgEventIds
  if (eventIds.length === 0) return []

  const today = new Date().toISOString().split('T')[0]

  let delQuery = supabase
    .from('deliverables')
    .select('*, partners!inner(id, name)')
    .in('event_id', eventIds)
    .lt('due_date', today)
    .order('due_date', { ascending: true })
    .limit(10)

  // Status filter
  if (f.status) {
    delQuery = delQuery.eq('status', f.status)
  } else {
    delQuery = delQuery.in('status', ['not_started', 'in_progress'])
  }

  if (f.category) delQuery = delQuery.eq('category', f.category)

  if (f.partnerName) {
    const partnerIds = await resolvePartnerIds(supabase, orgId, f.partnerName, eventIds)
    if (partnerIds.length === 0) return []
    delQuery = delQuery.in('partner_id', partnerIds)
  }

  const { data, error } = await delQuery

  if (error) handleDbError(error, 'Failed to load overdue deliverables')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const { partners, ...deliverable } = row as Deliverable & { partners: { id: string; name: string } }
    return { ...deliverable, partner: partners } as DeliverableWithPartner
  })
}

// =============================================================================
// Needs-proof deliverables list
// =============================================================================

/** Up to 10 deliverables with status 'done' and zero proofs, with partner name. */
export async function getNeedsProofDeliverables(ctx: DashboardContext): Promise<DeliverableWithPartner[]>
export async function getNeedsProofDeliverables(orgId: string, filters?: DashboardFilters): Promise<DeliverableWithPartner[]>
export async function getNeedsProofDeliverables(orgIdOrCtx: string | DashboardContext, filters?: DashboardFilters): Promise<DeliverableWithPartner[]> {
  const ctx = typeof orgIdOrCtx === 'string'
    ? await createDashboardContext(orgIdOrCtx, filters)
    : orgIdOrCtx
  const { supabase, orgId, filters: f } = ctx

  // Needs-proof only applies to 'done' status
  if (f.status && f.status !== 'done') return []

  // Use pre-resolved event IDs from context
  const eventIds = f.eventId || f.seasonId
    ? (ctx.filteredEventIds ?? [])
    : ctx.orgEventIds
  if (eventIds.length === 0) return []

  let delQuery = supabase
    .from('deliverables')
    .select('*, partners!inner(id, name)')
    .in('event_id', eventIds)
    .eq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (f.category) delQuery = delQuery.eq('category', f.category)

  if (f.partnerName) {
    const partnerIds = await resolvePartnerIds(supabase, orgId, f.partnerName, eventIds)
    if (partnerIds.length === 0) return []
    delQuery = delQuery.in('partner_id', partnerIds)
  }

  const { data, error } = await delQuery

  if (error) handleDbError(error, 'Failed to load needs-proof deliverables')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: DeliverableWithPartner[] = (data ?? []).map((row: any) => {
    const { partners, ...deliverable } = row as Deliverable & { partners: { id: string; name: string } }
    return { ...deliverable, partner: partners } as DeliverableWithPartner
  })

  if (rows.length === 0) return []

  // Filter to only deliverables with zero actual proofs
  const proofCounts = await countProofByDeliverable(rows.map((r) => r.id))
  return rows.filter((r) => (proofCounts[r.id] ?? 0) === 0).slice(0, 10)
}

// =============================================================================
// Pending-approval deliverables list
// =============================================================================

/** Deliverables with status 'pending_approval', with partner name. */
export async function getPendingApprovalDeliverables(ctx: DashboardContext): Promise<DeliverableWithPartner[]>
export async function getPendingApprovalDeliverables(orgId: string, filters?: DashboardFilters): Promise<DeliverableWithPartner[]>
export async function getPendingApprovalDeliverables(orgIdOrCtx: string | DashboardContext, filters?: DashboardFilters): Promise<DeliverableWithPartner[]> {
  const ctx = typeof orgIdOrCtx === 'string'
    ? await createDashboardContext(orgIdOrCtx, filters)
    : orgIdOrCtx
  const { supabase, orgId, filters: f } = ctx

  if (f.status && f.status !== 'pending_approval') return []

  // Use pre-resolved event IDs from context
  const eventIds = f.eventId || f.seasonId
    ? (ctx.filteredEventIds ?? [])
    : ctx.orgEventIds
  if (eventIds.length === 0) return []

  let delQuery = supabase
    .from('deliverables')
    .select('*, partners!inner(id, name)')
    .in('event_id', eventIds)
    .eq('status', 'pending_approval')
    .order('updated_at', { ascending: true })
    .limit(20)

  if (f.category) delQuery = delQuery.eq('category', f.category)

  if (f.partnerName) {
    const partnerIds = await resolvePartnerIds(supabase, orgId, f.partnerName, eventIds)
    if (partnerIds.length === 0) return []
    delQuery = delQuery.in('partner_id', partnerIds)
  }

  const { data, error } = await delQuery

  if (error) handleDbError(error, 'Failed to load pending approval deliverables')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const { partners, ...deliverable } = row as Deliverable & { partners: { id: string; name: string } }
    return { ...deliverable, partner: partners } as DeliverableWithPartner
  })
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
    if (isDeliverableCompleted(d.status)) entry.completed++
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
export async function getUpcomingRenewals(ctx: DashboardContext, daysAhead?: number): Promise<UpcomingRenewal[]>
export async function getUpcomingRenewals(orgId: string, daysAhead?: number, filters?: DashboardFilters): Promise<UpcomingRenewal[]>
export async function getUpcomingRenewals(orgIdOrCtx: string | DashboardContext, daysAhead: number = 90, filters?: DashboardFilters): Promise<UpcomingRenewal[]> {
  const ctx = typeof orgIdOrCtx === 'string'
    ? await createDashboardContext(orgIdOrCtx, filters)
    : orgIdOrCtx
  const { supabase, orgId, filters: f } = ctx
  if (typeof orgIdOrCtx !== 'string' && typeof daysAhead !== 'number') daysAhead = 90

  const today = new Date().toISOString().slice(0, 10)
  const futureDate = new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10)

  let query = supabase
    .from('partners')
    .select('id, name, renewal_date, deal_value, event_id, events!inner(name)')
    .eq('org_id', orgId)
    .gte('renewal_date', today)
    .lte('renewal_date', futureDate)
    .order('renewal_date', { ascending: true })
    .limit(30)

  if (ctx.filteredEventIds) {
    if (ctx.filteredEventIds.length === 0) return []
    query = query.in('event_id', ctx.filteredEventIds)
  }

  if (f.partnerName) {
    query = query.ilike('name', f.partnerName)
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

// =============================================================================
// Expiring Usage Rights
// =============================================================================

export interface ExpiringUsageRight {
  deliverable_id: string
  deliverable_title: string
  partner_name: string
  event_name: string
  event_id: string
  partner_id: string
  expiration_date: string
  talent_name: string | null
}

/** Talent deliverables with usage_expiration_date in the next N days. */
export async function getExpiringUsageRights(ctx: DashboardContext, daysAhead?: number): Promise<ExpiringUsageRight[]>
export async function getExpiringUsageRights(orgId: string, daysAhead?: number, filters?: DashboardFilters): Promise<ExpiringUsageRight[]>
export async function getExpiringUsageRights(orgIdOrCtx: string | DashboardContext, daysAhead: number = 60, filters?: DashboardFilters): Promise<ExpiringUsageRight[]> {
  const ctx = typeof orgIdOrCtx === 'string'
    ? await createDashboardContext(orgIdOrCtx, filters)
    : orgIdOrCtx
  const { supabase, orgId, filters: f } = ctx
  if (typeof orgIdOrCtx !== 'string' && typeof daysAhead !== 'number') daysAhead = 60

  const today = new Date().toISOString().slice(0, 10)
  const futureDate = new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10)

  // Use pre-resolved event IDs from context (all events, not just non-archived)
  const eventIds = f.eventId || f.seasonId
    ? (ctx.filteredEventIds ?? [])
    : ctx.orgEventIds
  if (eventIds.length === 0) return []

  let query = supabase
    .from('deliverables')
    .select('id, title, event_id, partner_id, usage_expiration_date, talent_id')
    .in('event_id', eventIds)
    .eq('category', 'talent')
    .not('usage_expiration_date', 'is', null)
    .lte('usage_expiration_date', futureDate)
    .order('usage_expiration_date', { ascending: true })
    .limit(30)

  if (f.partnerName) {
    const { data: matchingPartners } = await supabase
      .from('partners')
      .select('id')
      .in('event_id', eventIds)
      .ilike('name', f.partnerName)

    if (!matchingPartners || matchingPartners.length === 0) return []
    query = query.in('partner_id', matchingPartners.map((p: { id: string }) => p.id))
  }

  const { data, error } = await query
  if (error) handleDbError(error, 'Failed to load expiring usage rights')

  const rows = (data ?? []) as Array<{
    id: string
    title: string
    event_id: string
    partner_id: string
    usage_expiration_date: string
    talent_id: string | null
  }>

  if (rows.length === 0) return []

  // Fetch partner names, event names, and talent names in PARALLEL
  const partnerIds = [...new Set(rows.map((d) => d.partner_id))]
  const rowEventIds = [...new Set(rows.map((d) => d.event_id))]
  const talentIds = [...new Set(rows.map((d) => d.talent_id).filter(Boolean) as string[])]

  const [partnersResult, eventsResult, talentsResult] = await Promise.all([
    supabase.from('partners').select('id, name').in('id', partnerIds),
    supabase.from('events').select('id, name').in('id', rowEventIds),
    talentIds.length > 0
      ? supabase.from('talent').select('id, name').in('id', talentIds)
      : Promise.resolve({ data: [] }),
  ])

  const partnerMap = new Map(
    ((partnersResult.data ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name])
  )
  const eventMap = new Map(
    ((eventsResult.data ?? []) as { id: string; name: string }[]).map((e) => [e.id, e.name])
  )
  const talentMap = new Map(
    ((talentsResult.data ?? []) as { id: string; name: string }[]).map((t) => [t.id, t.name])
  )

  return rows.map((row) => ({
    deliverable_id: row.id,
    deliverable_title: row.title,
    partner_name: partnerMap.get(row.partner_id) ?? '',
    event_name: eventMap.get(row.event_id) ?? '',
    event_id: row.event_id,
    partner_id: row.partner_id,
    expiration_date: row.usage_expiration_date,
    talent_name: row.talent_id ? (talentMap.get(row.talent_id) ?? null) : null,
  }))
}
