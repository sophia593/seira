import { createClient } from '@/lib/supabase/server'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { handleDbError } from './client'
import type { ActivityAction, ActivityTargetType, ActivityLog } from '@/lib/types/database'

// =============================================================================
// Write — fire-and-forget, uses admin client (bypasses RLS)
// =============================================================================

export async function logActivity(params: {
  orgId: string
  userId: string
  action: ActivityAction
  targetType: ActivityTargetType
  targetId?: string
  eventId?: string
  details?: Record<string, unknown>
}): Promise<void> {
  const admin = tryCreateAdminClient()
  if (!admin) return

  try {
    await admin.from('activity_log').insert({
      org_id: params.orgId,
      user_id: params.userId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId ?? null,
      event_id: params.eventId ?? null,
      details_json: params.details ?? {},
    })
  } catch (err) {
    console.error('[logActivity] failed:', err)
  }
}

// =============================================================================
// Read — recent activity for dashboard
// =============================================================================

export async function getRecentActivity(
  orgId: string,
  limit = 15,
  filters?: { eventId?: string; seasonId?: string },
): Promise<ActivityLog[]> {
  const supabase = await createClient()

  let query = supabase
    .from('activity_log')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters?.eventId) {
    query = query.eq('event_id', filters.eventId)
  } else if (filters?.seasonId) {
    // Resolve event IDs for the season
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('season_id', filters.seasonId)

    const eventIds = (events ?? []).map((e) => e.id)
    if (eventIds.length === 0) return []
    query = query.in('event_id', eventIds)
  }

  const { data, error } = await query

  if (error) handleDbError(error, 'Failed to load recent activity')

  return (data ?? []) as ActivityLog[]
}

// =============================================================================
// Read — activity for a specific event
// =============================================================================

export async function getPartnerActivity(
  orgId: string,
  partnerIds: string[],
  eventIds: string[],
  limit = 50,
): Promise<ActivityLog[]> {
  if (partnerIds.length === 0 || eventIds.length === 0) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('org_id', orgId)
    .in('event_id', eventIds)
    .in('target_type', ['partner', 'deliverable', 'proof', 'recap'])
    .order('created_at', { ascending: false })
    .limit(limit * 2)

  if (error) handleDbError(error, 'Failed to load partner activity')

  const pidSet = new Set(partnerIds)
  return ((data ?? []) as ActivityLog[])
    .filter((a) => {
      if (a.target_type === 'partner' && a.target_id && pidSet.has(a.target_id)) return true
      const detailPid = (a.details_json as Record<string, unknown>)?.partner_id
      return typeof detailPid === 'string' && pidSet.has(detailPid)
    })
    .slice(0, limit)
}

// =============================================================================
// Read — activity for a specific deliverable (+ its proofs)
// =============================================================================

export async function getDeliverableActivity(
  deliverableId: string,
  proofIds: string[],
  limit = 30,
): Promise<ActivityLog[]> {
  const supabase = await createClient()

  const orFilter =
    proofIds.length > 0
      ? `and(target_type.eq.deliverable,target_id.eq.${deliverableId}),and(target_type.eq.proof,target_id.in.(${proofIds.join(',')}))`
      : `and(target_type.eq.deliverable,target_id.eq.${deliverableId})`

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) handleDbError(error, 'Failed to load deliverable activity')

  return (data ?? []) as ActivityLog[]
}

// =============================================================================
// Read — activity for a specific event
// =============================================================================

export async function getEventActivity(eventId: string, limit = 30): Promise<ActivityLog[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) handleDbError(error, 'Failed to load event activity')

  return (data ?? []) as ActivityLog[]
}
