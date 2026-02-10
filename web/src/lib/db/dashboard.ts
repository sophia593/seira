// lib/db/dashboard.ts
// Dashboard data layer — queries Supabase views for stat cards and lists

import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type {
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

  const { data, error } = await supabase
    .from('event_completion')
    .select('status, total_deliverables, completed_deliverables, overdue_count')
    .eq('org_id', orgId)
    .neq('status', 'archived')

  if (error) handleDbError(error, 'Failed to load dashboard stats')

  const rows = data ?? []

  let activeEvents = 0
  let totalDeliverables = 0
  let completedDeliverables = 0
  let overdueCount = 0

  for (const row of rows) {
    if (row.status === 'upcoming' || row.status === 'active') {
      activeEvents++
    }
    totalDeliverables += row.total_deliverables ?? 0
    completedDeliverables += row.completed_deliverables ?? 0
    overdueCount += row.overdue_count ?? 0
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

  const { data, error } = await supabase
    .from('event_completion')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['upcoming', 'active'])
    .order('date', { ascending: true, nullsFirst: false })
    .limit(5)

  if (error) handleDbError(error, 'Failed to load upcoming events')

  return (data ?? []) as EventWithCompletion[]
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

/** Up to 10 deliverables with status 'done' (awaiting proof), with partner name. */
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
    .limit(10)

  if (error) handleDbError(error, 'Failed to load needs-proof deliverables')

  return (data ?? []).map((row) => {
    const { partners, ...deliverable } = row as Deliverable & { partners: { id: string; name: string } }
    return { ...deliverable, partner: partners } as DeliverableWithPartner
  })
}
