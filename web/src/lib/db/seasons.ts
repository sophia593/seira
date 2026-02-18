import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type { Season, CreateSeasonInput, SeasonWithStats } from '@/lib/types/database'

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
      if (d.status === 'done' || d.status === 'proved') {
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
