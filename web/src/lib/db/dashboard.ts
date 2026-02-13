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
  Partner,
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

// =============================================================================
// Stat cards
// =============================================================================

/** Aggregate stats across non-archived events for the org. */
export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  const supabase = await createClient()

  // 1. All non-archived events for this org
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, status')
    .eq('org_id', orgId)
    .neq('status', 'archived')

  if (eventError) handleDbError(eventError, 'Failed to load dashboard stats')
  if (!events || events.length === 0) {
    return { activeEvents: 0, totalDeliverables: 0, overdueCount: 0, completionPct: 0 }
  }

  const activeEvents = events.filter(
    (e) => e.status === 'upcoming' || e.status === 'active'
  ).length

  // 2. All deliverables for those events
  const eventIds = events.map((e) => e.id)
  const { data: deliverables, error: delError } = await supabase
    .from('deliverables')
    .select('id, event_id, status, due_date')
    .in('event_id', eventIds)

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
export async function getUpcomingEvents(orgId: string): Promise<EventWithCompletion[]> {
  const supabase = await createClient()

  // 1. Upcoming/active events, limit 5
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['upcoming', 'active'])
    .order('date', { ascending: true, nullsFirst: false })
    .limit(5)

  if (eventError) handleDbError(eventError, 'Failed to load upcoming events')
  if (!events || events.length === 0) return []

  // 2. Deliverables for those events
  const eventIds = events.map((e) => e.id)
  const { data: deliverables, error: delError } = await supabase
    .from('deliverables')
    .select('id, event_id, status, due_date')
    .in('event_id', eventIds)

  if (delError) handleDbError(delError, 'Failed to load deliverables for upcoming events')

  // 3. Compute per-event stats
  const today = new Date(new Date().toDateString())
  const stats: Record<string, { total: number; completed: number; overdue: number }> = {}
  for (const d of deliverables ?? []) {
    const entry = stats[d.event_id] ?? { total: 0, completed: 0, overdue: 0 }
    entry.total++
    if (d.status === 'done' || d.status === 'proved') entry.completed++
    if (d.due_date && d.status !== 'done' && d.status !== 'proved' && new Date(d.due_date) < today) {
      entry.overdue++
    }
    stats[d.event_id] = entry
  }

  return (events as Event[]).map((e) => {
    const s = stats[e.id] ?? { total: 0, completed: 0, overdue: 0 }
    return {
      ...e,
      total_deliverables: s.total,
      completed_deliverables: s.completed,
      overdue_count: s.overdue,
      completion_pct: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    }
  })
}

// =============================================================================
// Overdue deliverables list
// =============================================================================

/** Up to 10 overdue deliverables with partner name, across all org events. */
export async function getOverdueDeliverables(orgId: string): Promise<DeliverableWithPartner[]> {
  const supabase = await createClient()

  // Get non-archived event IDs for this org
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .eq('org_id', orgId)
    .neq('status', 'archived')

  if (eventsError) handleDbError(eventsError, 'Failed to load org events for overdue')
  if (!events || events.length === 0) return []

  const eventIds = events.map((e) => e.id)
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('deliverables')
    .select('*, partners!inner(id, name)')
    .in('event_id', eventIds)
    .in('status', ['not_started', 'in_progress'])
    .lt('due_date', today)
    .order('due_date', { ascending: true })
    .limit(10)

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
export async function getNeedsProofDeliverables(orgId: string): Promise<DeliverableWithPartner[]> {
  const supabase = await createClient()

  // Get non-archived event IDs for this org
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .eq('org_id', orgId)
    .neq('status', 'archived')

  if (eventsError) handleDbError(eventsError, 'Failed to load org events for needs-proof')
  if (!events || events.length === 0) return []

  const eventIds = events.map((e) => e.id)

  const { data, error } = await supabase
    .from('deliverables')
    .select('*, partners!inner(id, name)')
    .in('event_id', eventIds)
    .eq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false })

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
