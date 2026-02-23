import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import { isDeliverableCompleted } from '@/lib/constants'
import type { Season, CreateSeasonInput, SeasonWithStats, SeasonPartnerRollup, DeliverableStatus } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

export async function listSeasons(orgId: string): Promise<Season[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false, nullsFirst: false })

  if (error) handleDbError(error, 'Failed to list seasons')

  return (data ?? []) as Season[]
}

export async function getSeasonById(seasonId: string): Promise<Season | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get season')
  }

  return data as Season
}

/** List all seasons with aggregated event/deliverable stats. */
export async function listSeasonsWithStats(orgId: string): Promise<SeasonWithStats[]> {
  const supabase = await createClient()

  // 1. All seasons for this org
  const { data: seasons, error: seasonError } = await supabase
    .from('seasons')
    .select('*')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false, nullsFirst: false })

  if (seasonError) handleDbError(seasonError, 'Failed to list seasons')
  if (!seasons || seasons.length === 0) return []

  const seasonIds = seasons.map((s) => s.id)

  // 2. All events assigned to these seasons
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, season_id')
    .in('season_id', seasonIds)

  if (eventError) handleDbError(eventError, 'Failed to fetch events for seasons')

  const eventIds = (events ?? []).map((e) => e.id)

  // 3. All deliverables for those events
  const { data: deliverables, error: delError } = eventIds.length > 0
    ? await supabase
        .from('deliverables')
        .select('id, event_id, status')
        .in('event_id', eventIds)
    : { data: [], error: null }

  if (delError) handleDbError(delError, 'Failed to fetch deliverables for seasons')

  // 4. Build per-event stats
  const eventSeasonMap: Record<string, string> = {}
  for (const e of events ?? []) {
    if (e.season_id) eventSeasonMap[e.id] = e.season_id
  }

  const stats: Record<string, { events: number; total: number; completed: number }> = {}
  for (const s of seasons) {
    stats[s.id] = { events: 0, total: 0, completed: 0 }
  }

  // Count events per season
  for (const e of events ?? []) {
    if (e.season_id && stats[e.season_id]) {
      stats[e.season_id].events++
    }
  }

  // Count deliverables per season (via event → season mapping)
  for (const d of deliverables ?? []) {
    const seasonId = eventSeasonMap[d.event_id]
    if (seasonId && stats[seasonId]) {
      stats[seasonId].total++
      if (isDeliverableCompleted(d.status as DeliverableStatus)) {
        stats[seasonId].completed++
      }
    }
  }

  return (seasons as Season[]).map((s) => {
    const st = stats[s.id] ?? { events: 0, total: 0, completed: 0 }
    return {
      ...s,
      event_count: st.events,
      total_deliverables: st.total,
      completed_deliverables: st.completed,
      completion_pct: st.total > 0 ? Math.round((st.completed / st.total) * 100) : 0,
    }
  })
}

/** Aggregate partner fulfillment across all events in a season, grouped by partner name. */
export async function getSeasonPartnerRollup(seasonId: string): Promise<SeasonPartnerRollup[]> {
  const supabase = await createClient()

  // 1. Events in this season
  const { data: events, error: eventErr } = await supabase
    .from('events')
    .select('id, name')
    .eq('season_id', seasonId)

  if (eventErr) handleDbError(eventErr, 'Failed to fetch season events')
  if (!events || events.length === 0) return []

  const eventIds = events.map((e) => e.id)
  const eventMap: Record<string, string> = Object.fromEntries(events.map((e) => [e.id, e.name]))

  // 2. Partners for those events
  const { data: partners, error: partnerErr } = await supabase
    .from('partners')
    .select('id, event_id, name')
    .in('event_id', eventIds)

  if (partnerErr) handleDbError(partnerErr, 'Failed to fetch partners')
  if (!partners || partners.length === 0) return []

  // 3. Deliverables for those events
  const { data: deliverables, error: delErr } = await supabase
    .from('deliverables')
    .select('id, partner_id, status, due_date')
    .in('event_id', eventIds)

  if (delErr) handleDbError(delErr, 'Failed to fetch deliverables')

  // 4. Group partners by normalized name
  const groups = new Map<string, {
    displayName: string
    partnerIds: Set<string>
    eventIds: Set<string>
  }>()

  for (const p of partners) {
    const key = p.name.toLowerCase().trim()
    const existing = groups.get(key)
    if (existing) {
      existing.partnerIds.add(p.id)
      existing.eventIds.add(p.event_id)
    } else {
      groups.set(key, {
        displayName: p.name,
        partnerIds: new Set([p.id]),
        eventIds: new Set([p.event_id]),
      })
    }
  }

  // 5. Index deliverables by partner_id
  const delByPartner = new Map<string, { status: string; due_date: string | null }[]>()
  for (const d of deliverables ?? []) {
    const arr = delByPartner.get(d.partner_id) ?? []
    arr.push(d)
    delByPartner.set(d.partner_id, arr)
  }

  // 6. Aggregate per group
  const today = new Date(new Date().toDateString())
  const results: SeasonPartnerRollup[] = []

  for (const [, group] of groups) {
    let total = 0
    let completed = 0
    let proved = 0
    let overdue = 0

    for (const pid of group.partnerIds) {
      for (const d of delByPartner.get(pid) ?? []) {
        total++
        if (isDeliverableCompleted(d.status as DeliverableStatus)) {
          completed++
          if (d.status === 'proved') proved++
        } else if (d.due_date && new Date(d.due_date) < today) {
          overdue++
        }
      }
    }

    results.push({
      name: group.displayName,
      event_count: group.eventIds.size,
      events: [...group.eventIds].map((eid) => ({ id: eid, name: eventMap[eid] })),
      total_deliverables: total,
      completed_deliverables: completed,
      proved_deliverables: proved,
      overdue_count: overdue,
      completion_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    })
  }

  results.sort((a, b) => a.name.localeCompare(b.name))
  return results
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createSeason(
  orgId: string,
  input: CreateSeasonInput
): Promise<Season> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      org_id: orgId,
      name: input.name,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create season')

  return data as Season
}

export async function updateSeason(
  seasonId: string,
  input: Partial<CreateSeasonInput>
): Promise<Season> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.start_date !== undefined) updates.start_date = input.start_date || null
  if (input.end_date !== undefined) updates.end_date = input.end_date || null

  const { data, error } = await supabase
    .from('seasons')
    .update(updates)
    .eq('id', seasonId)
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to update season')

  return data as Season
}

export async function deleteSeason(seasonId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('seasons')
    .delete()
    .eq('id', seasonId)

  if (error) handleDbError(error, 'Failed to delete season')
}
