import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import { DEFAULT_ASSETS } from '@/lib/constants'
import type { Asset, CreateAssetInput, AssetUtilization, SeasonAssetUtilization, AssetUtilizationSummary } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

export async function listAssets(orgId: string): Promise<Asset[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })

  if (error) handleDbError(error, 'Failed to list assets')

  return (data ?? []) as Asset[]
}

export async function getAssetById(id: string): Promise<Asset | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) handleDbError(error, 'Failed to load asset')

  return data as Asset | null
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createAsset(
  orgId: string,
  input: CreateAssetInput
): Promise<Asset> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .insert({
      org_id: orgId,
      name: input.name,
      capacity: input.capacity ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create asset')

  return data as Asset
}

export async function updateAsset(
  id: string,
  input: Partial<CreateAssetInput>
): Promise<Asset> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.capacity !== undefined) updates.capacity = input.capacity
  if (input.notes !== undefined) updates.notes = input.notes || null

  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to update asset')

  return data as Asset
}

export async function deleteAsset(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)

  if (error) handleDbError(error, 'Failed to delete asset')
}

// =============================================================================
// Seed
// =============================================================================

export async function seedDefaultAssets(orgId: string): Promise<Asset[]> {
  const supabase = await createClient()

  const rows = DEFAULT_ASSETS.map((a) => ({
    org_id: orgId,
    name: a.name,
    capacity: a.capacity,
  }))

  const { data, error } = await supabase
    .from('assets')
    .upsert(rows, { onConflict: 'org_id,name', ignoreDuplicates: true })
    .select()

  if (error) handleDbError(error, 'Failed to seed default assets')

  return (data ?? []) as Asset[]
}

// =============================================================================
// Utilization Queries
// =============================================================================

/** Count how many deliverables use a given asset in a given event. */
export async function countAssetUsageInEvent(
  assetId: string,
  eventId: string,
): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('deliverables')
    .select('id', { count: 'exact', head: true })
    .eq('asset_id', assetId)
    .eq('event_id', eventId)

  if (error) handleDbError(error, 'Failed to count asset usage')

  return count ?? 0
}

/** Get asset utilization for a specific event. */
export async function getEventAssetUtilization(
  orgId: string,
  eventId: string,
): Promise<AssetUtilization[]> {
  const supabase = await createClient()

  const { data: assets, error: assetsErr } = await supabase
    .from('assets')
    .select('id, name, capacity')
    .eq('org_id', orgId)
    .order('name')

  if (assetsErr) handleDbError(assetsErr, 'Failed to list assets for utilization')
  if (!assets || assets.length === 0) return []

  const { data: deliverables, error: delErr } = await supabase
    .from('deliverables')
    .select('id, asset_id, partner_id, partners!inner(id, name)')
    .eq('event_id', eventId)
    .not('asset_id', 'is', null)

  if (delErr) handleDbError(delErr, 'Failed to list deliverables for utilization')

  const usageMap = new Map<string, { partners: Map<string, { id: string; name: string; count: number }>; total: number }>()
  for (const d of deliverables ?? []) {
    if (!d.asset_id) continue
    let entry = usageMap.get(d.asset_id)
    if (!entry) {
      entry = { partners: new Map(), total: 0 }
      usageMap.set(d.asset_id, entry)
    }
    entry.total++
    const partner = Array.isArray(d.partners) ? d.partners[0] : d.partners
    if (partner) {
      const p = entry.partners.get(partner.id as string)
      if (p) p.count++
      else entry.partners.set(partner.id as string, { id: partner.id as string, name: partner.name as string, count: 1 })
    }
  }

  const results: AssetUtilization[] = []
  for (const asset of assets) {
    const usage = usageMap.get(asset.id)
    if (!usage) continue
    const used = usage.total
    const capacity = asset.capacity as number | null
    const available = capacity != null ? Math.max(0, capacity - used) : null
    const utilization_pct = capacity != null && capacity > 0 ? Math.round((used / capacity) * 100) : null

    results.push({
      asset_id: asset.id,
      asset_name: asset.name,
      capacity,
      used,
      available,
      utilization_pct,
      partners: Array.from(usage.partners.values()),
    })
  }

  return results
}

/** Get asset utilization across all events in a season. */
export async function getSeasonAssetUtilization(
  orgId: string,
  seasonId: string,
): Promise<SeasonAssetUtilization[]> {
  const supabase = await createClient()

  const { data: events, error: evErr } = await supabase
    .from('events')
    .select('id')
    .eq('season_id', seasonId)
    .eq('org_id', orgId)

  if (evErr) handleDbError(evErr, 'Failed to list season events')
  if (!events || events.length === 0) return []

  const eventIds = events.map((e) => e.id)
  const totalEvents = eventIds.length

  const { data: assets, error: assetsErr } = await supabase
    .from('assets')
    .select('id, name, capacity')
    .eq('org_id', orgId)
    .order('name')

  if (assetsErr) handleDbError(assetsErr, 'Failed to list assets')
  if (!assets || assets.length === 0) return []

  const { data: deliverables, error: delErr } = await supabase
    .from('deliverables')
    .select('id, asset_id, event_id, partner_id, partners!inner(id, name)')
    .in('event_id', eventIds)
    .not('asset_id', 'is', null)

  if (delErr) handleDbError(delErr, 'Failed to list deliverables')

  const usageMap = new Map<string, {
    partners: Map<string, { id: string; name: string; count: number }>;
    events: Set<string>;
    total: number;
  }>()

  for (const d of deliverables ?? []) {
    if (!d.asset_id) continue
    let entry = usageMap.get(d.asset_id)
    if (!entry) {
      entry = { partners: new Map(), events: new Set(), total: 0 }
      usageMap.set(d.asset_id, entry)
    }
    entry.total++
    entry.events.add(d.event_id)
    const partner = Array.isArray(d.partners) ? d.partners[0] : d.partners
    if (partner) {
      const p = entry.partners.get(partner.id as string)
      if (p) p.count++
      else entry.partners.set(partner.id as string, { id: partner.id as string, name: partner.name as string, count: 1 })
    }
  }

  const results: SeasonAssetUtilization[] = []
  for (const asset of assets) {
    const usage = usageMap.get(asset.id)
    if (!usage) continue
    const used = usage.total
    const capacity = asset.capacity as number | null
    const available = capacity != null ? Math.max(0, capacity - used) : null
    const utilization_pct = capacity != null && capacity > 0 ? Math.round((used / capacity) * 100) : null

    results.push({
      asset_id: asset.id,
      asset_name: asset.name,
      capacity,
      used,
      available,
      utilization_pct,
      partners: Array.from(usage.partners.values()),
      events_used_in: usage.events.size,
      total_events: totalEvents,
    })
  }

  return results
}

/** Dashboard-level asset utilization summary across active events. */
export async function getAssetUtilizationSummary(
  orgId: string,
): Promise<AssetUtilizationSummary> {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('org_id', orgId)
    .in('status', ['upcoming', 'active'])

  const eventIds = (events ?? []).map((e) => e.id)

  const { data: assets } = await supabase
    .from('assets')
    .select('id, name, capacity')
    .eq('org_id', orgId)

  if (!assets || assets.length === 0) {
    return { total_assets: 0, avg_utilization_pct: 0, at_capacity_count: 0, underutilized_count: 0, underutilized_assets: [] }
  }

  if (eventIds.length === 0) {
    const cappedAssets = assets.filter((a) => a.capacity != null)
    return {
      total_assets: assets.length,
      avg_utilization_pct: 0,
      at_capacity_count: 0,
      underutilized_count: cappedAssets.length,
      underutilized_assets: cappedAssets.slice(0, 5).map((a) => ({
        name: a.name,
        utilization_pct: 0,
        available: a.capacity as number,
      })),
    }
  }

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('asset_id')
    .in('event_id', eventIds)
    .not('asset_id', 'is', null)

  const countByAsset = new Map<string, number>()
  for (const d of deliverables ?? []) {
    if (d.asset_id) countByAsset.set(d.asset_id, (countByAsset.get(d.asset_id) ?? 0) + 1)
  }

  const cappedAssets = assets.filter((a) => a.capacity != null)
  let totalPct = 0
  let atCapacity = 0
  const underutilized: { name: string; utilization_pct: number; available: number }[] = []

  for (const asset of cappedAssets) {
    const used = countByAsset.get(asset.id) ?? 0
    const cap = asset.capacity as number
    const pct = cap > 0 ? Math.round((used / cap) * 100) : 0
    totalPct += pct

    if (used >= cap && cap > 0) atCapacity++
    if (pct < 50) {
      underutilized.push({ name: asset.name, utilization_pct: pct, available: Math.max(0, cap - used) })
    }
  }

  const avgPct = cappedAssets.length > 0 ? Math.round(totalPct / cappedAssets.length) : 0
  underutilized.sort((a, b) => b.available - a.available)

  return {
    total_assets: assets.length,
    avg_utilization_pct: avgPct,
    at_capacity_count: atCapacity,
    underutilized_count: underutilized.length,
    underutilized_assets: underutilized.slice(0, 5),
  }
}
