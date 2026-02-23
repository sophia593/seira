import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import { isOverdue, completionPct, isDeliverableCompleted } from '@/lib/constants'
import type { Partner, CreatePartnerInput, DeliverableStatus, OrgPartnerRollup } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

/** Distinct partner names across all events for this org, sorted alphabetically. */
export async function listDistinctPartnerNames(orgId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partners')
    .select('name')
    .eq('org_id', orgId)
    .order('name', { ascending: true })

  if (error) handleDbError(error, 'Failed to list partner names')

  const seen = new Map<string, string>()
  for (const row of data ?? []) {
    const key = row.name.toLowerCase().trim()
    if (!seen.has(key)) seen.set(key, row.name)
  }
  return [...seen.values()]
}

export async function listPartnersByEvent(eventId: string): Promise<Partner[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('event_id', eventId)
    .order('name', { ascending: true })

  if (error) {
    handleDbError(error, 'Failed to list partners')
  }

  return (data ?? []) as Partner[]
}

export async function getPartnerById(partnerId: string): Promise<Partner | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get partner')
  }

  return data as Partner
}

// =============================================================================
// Org-wide Partner Rollup (CRM-lite)
// =============================================================================

/** All partners across all events, grouped by normalized name with aggregated stats. */
export async function getOrgPartnerRollup(orgId: string): Promise<OrgPartnerRollup[]> {
  const supabase = await createClient()

  // 1. All partners for the org
  const { data: partners, error: pErr } = await supabase
    .from('partners')
    .select('id, event_id, name, contact_name, contact_email, contract_notes, deal_value, renewal_date, updated_at')
    .eq('org_id', orgId)

  if (pErr) handleDbError(pErr, 'Failed to fetch partners')
  if (!partners || partners.length === 0) return []

  // 2. All events for the org (for name map)
  const { data: events, error: eErr } = await supabase
    .from('events')
    .select('id, name')
    .eq('org_id', orgId)

  if (eErr) handleDbError(eErr, 'Failed to fetch events')
  const eventMap: Record<string, string> = {}
  for (const e of events ?? []) eventMap[e.id] = e.name

  // 3. All deliverables for those events
  const eventIds = (events ?? []).map((e) => e.id)
  const { data: deliverables, error: dErr } = eventIds.length > 0
    ? await supabase
        .from('deliverables')
        .select('partner_id, status, due_date')
        .in('event_id', eventIds)
    : { data: [] as { partner_id: string; status: string; due_date: string | null }[], error: null }

  if (dErr) handleDbError(dErr, 'Failed to fetch deliverables')

  // 4. All recaps for the org (published or draft)
  let recaps: { id: string; partner_id: string; status: string; published_at: string | null; created_at: string; event_id: string; share_token: string }[] = []
  try {
    const { data: recapData, error: rErr } = await supabase
      .from('recap_reports')
      .select('id, partner_id, status, published_at, created_at, event_id, share_token')
      .eq('org_id', orgId)
      .in('status', ['published', 'draft'])
      .order('published_at', { ascending: false })
    if (!rErr) recaps = recapData ?? []
  } catch {
    // recap_reports table may not exist yet
  }

  // 5. Group partners by normalized name
  const groups = new Map<string, {
    displayName: string
    partnerIds: Set<string>
    eventIds: Set<string>
    contactName: string | null
    contactEmail: string | null
    latestUpdatedAt: string
    totalDealValue: number
    renewalDates: string[]
    dealSummaries: { event_name: string; event_id: string; notes: string }[]
    partnerIdToEventId: Map<string, string>
  }>()

  for (const p of partners) {
    const key = p.name.toLowerCase().trim()
    const existing = groups.get(key)
    if (existing) {
      existing.partnerIds.add(p.id)
      existing.eventIds.add(p.event_id)
      existing.partnerIdToEventId.set(p.id, p.event_id)
      // Take contact from most recently updated record
      if (p.updated_at > existing.latestUpdatedAt) {
        existing.contactName = p.contact_name
        existing.contactEmail = p.contact_email
        existing.latestUpdatedAt = p.updated_at
      }
      if (p.deal_value != null) existing.totalDealValue += p.deal_value
      if (p.renewal_date) existing.renewalDates.push(p.renewal_date)
      if (p.contract_notes) {
        existing.dealSummaries.push({
          event_name: eventMap[p.event_id] ?? '',
          event_id: p.event_id,
          notes: p.contract_notes,
        })
      }
    } else {
      const dealSummaries: { event_name: string; event_id: string; notes: string }[] = []
      if (p.contract_notes) {
        dealSummaries.push({
          event_name: eventMap[p.event_id] ?? '',
          event_id: p.event_id,
          notes: p.contract_notes,
        })
      }
      groups.set(key, {
        displayName: p.name,
        partnerIds: new Set([p.id]),
        eventIds: new Set([p.event_id]),
        contactName: p.contact_name,
        contactEmail: p.contact_email,
        latestUpdatedAt: p.updated_at,
        totalDealValue: p.deal_value ?? 0,
        renewalDates: p.renewal_date ? [p.renewal_date] : [],
        dealSummaries,
        partnerIdToEventId: new Map([[p.id, p.event_id]]),
      })
    }
  }

  // 6. Index deliverables by partner_id
  const delByPartner = new Map<string, { status: string; due_date: string | null }[]>()
  for (const d of deliverables ?? []) {
    const arr = delByPartner.get(d.partner_id) ?? []
    arr.push(d)
    delByPartner.set(d.partner_id, arr)
  }

  // 7. Build partner_id → groupKey reverse index for recap lookup
  const partnerIdToGroup = new Map<string, string>()
  for (const [key, group] of groups) {
    for (const pid of group.partnerIds) {
      partnerIdToGroup.set(pid, key)
    }
  }

  // 8. Find best recap per group
  const bestRecap = new Map<string, OrgPartnerRollup['last_recap']>()
  for (const r of recaps) {
    const gKey = partnerIdToGroup.get(r.partner_id)
    if (!gKey) continue
    const existing = bestRecap.get(gKey)
    // Published always wins over draft; among same status, most recent wins
    if (!existing) {
      bestRecap.set(gKey, {
        id: r.id,
        status: r.status as 'draft' | 'published',
        date: r.published_at ?? r.created_at,
        event_id: r.event_id,
        share_token: r.share_token,
      })
    } else if (r.status === 'published' && existing.status === 'draft') {
      bestRecap.set(gKey, {
        id: r.id,
        status: 'published',
        date: r.published_at ?? r.created_at,
        event_id: r.event_id,
        share_token: r.share_token,
      })
    }
  }

  // 9. Aggregate per group
  const today = new Date(new Date().toDateString())
  const results: OrgPartnerRollup[] = []

  for (const [key, group] of groups) {
    let total = 0
    let completed = 0
    let proved = 0
    let overdue = 0

    // Per-event stats
    const perEventMap = new Map<string, { event_id: string; partner_id: string; event_name: string; total: number; completed: number }>()

    for (const pid of group.partnerIds) {
      const eid = group.partnerIdToEventId.get(pid) ?? ''
      if (!perEventMap.has(eid)) {
        perEventMap.set(eid, { event_id: eid, partner_id: pid, event_name: eventMap[eid] ?? '', total: 0, completed: 0 })
      }
      const eventStats = perEventMap.get(eid)!

      for (const d of delByPartner.get(pid) ?? []) {
        total++
        eventStats.total++
        if (isDeliverableCompleted(d.status as DeliverableStatus)) {
          completed++
          eventStats.completed++
          if (d.status === 'proved') proved++
        } else if (d.due_date && new Date(d.due_date) < today) {
          overdue++
        }
      }
    }

    // Compute next_renewal_date: earliest future renewal, or earliest overall if all past
    const todayStr = today.toISOString().slice(0, 10)
    const futureRenewals = group.renewalDates.filter((d) => d >= todayStr).sort()
    const next_renewal_date = futureRenewals.length > 0
      ? futureRenewals[0]
      : group.renewalDates.length > 0
        ? group.renewalDates.sort()[0]
        : null

    results.push({
      name: group.displayName,
      event_count: group.eventIds.size,
      events: [...group.eventIds].map((eid) => ({ id: eid, name: eventMap[eid] ?? '' })),
      total_deliverables: total,
      completed_deliverables: completed,
      proved_deliverables: proved,
      overdue_count: overdue,
      completion_pct: completionPct(total, completed),
      contact_name: group.contactName,
      contact_email: group.contactEmail,
      total_deal_value: group.totalDealValue,
      next_renewal_date,
      deal_summaries: group.dealSummaries,
      per_event_stats: [...perEventMap.values()].map((s) => ({
        ...s,
        completion_pct: completionPct(s.total, s.completed),
      })),
      last_recap: bestRecap.get(key) ?? null,
    })
  }

  results.sort((a, b) => a.name.localeCompare(b.name))
  return results
}

// =============================================================================
// Export
// =============================================================================

export interface PartnerExportRow {
  partner_name: string
  contact_name: string | null
  contact_email: string | null
  contract_notes: string | null
  deal_value: number | null
  renewal_date: string | null
  event_name: string
  total: number
  completed: number
  proved: number
  overdue: number
  completion_pct: number
}

/** Flat partner rows with aggregated deliverable stats for CSV export. */
export async function listPartnersForExport(
  orgId: string,
  filters?: { eventId?: string; seasonId?: string },
): Promise<PartnerExportRow[]> {
  const supabase = await createClient()

  // If seasonId, resolve event IDs first
  let seasonEventIds: string[] | null = null
  if (filters?.seasonId) {
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('season_id', filters.seasonId)
    seasonEventIds = (events ?? []).map((e) => e.id)
    if (seasonEventIds.length === 0) return []
  }

  let query = supabase
    .from('partners')
    .select('id, name, contact_name, contact_email, contract_notes, deal_value, renewal_date, event_id, events!inner(name)')
    .eq('org_id', orgId)
    .order('name')
    .limit(10000)

  if (filters?.eventId) {
    query = query.eq('event_id', filters.eventId)
  } else if (seasonEventIds) {
    query = query.in('event_id', seasonEventIds)
  }

  const { data: partners, error } = await query
  if (error) handleDbError(error, 'Failed to export partners')
  if (!partners || partners.length === 0) return []

  // Fetch all deliverables for these partners in one query
  const partnerIds = partners.map((p: Record<string, unknown>) => p.id as string)
  const { data: deliverables, error: dErr } = await supabase
    .from('deliverables')
    .select('partner_id, status, due_date')
    .in('partner_id', partnerIds)
  if (dErr) handleDbError(dErr, 'Failed to fetch deliverables for partner export')

  // Aggregate stats per partner
  const stats: Record<string, { total: number; completed: number; proved: number; overdue: number }> = {}
  for (const d of deliverables ?? []) {
    const entry = stats[d.partner_id] ?? { total: 0, completed: 0, proved: 0, overdue: 0 }
    entry.total++
    const status = d.status as DeliverableStatus
    if (isDeliverableCompleted(status)) entry.completed++
    if (status === 'proved') entry.proved++
    if (isOverdue(status, d.due_date)) entry.overdue++
    stats[d.partner_id] = entry
  }

  return partners.map((row: Record<string, unknown>) => {
    const event = (Array.isArray(row.events) ? row.events[0] : row.events) as { name: string } | null
    const id = row.id as string
    const s = stats[id] ?? { total: 0, completed: 0, proved: 0, overdue: 0 }
    return {
      partner_name: row.name as string,
      contact_name: row.contact_name as string | null,
      contact_email: row.contact_email as string | null,
      contract_notes: row.contract_notes as string | null,
      deal_value: row.deal_value as number | null,
      renewal_date: row.renewal_date as string | null,
      event_name: event?.name ?? '',
      total: s.total,
      completed: s.completed,
      proved: s.proved,
      overdue: s.overdue,
      completion_pct: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    }
  })
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createPartner(
  orgId: string,
  input: CreatePartnerInput
): Promise<Partner> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partners')
    .insert({
      org_id: orgId,
      event_id: input.event_id,
      name: input.name,
      contact_name: input.contact_name ?? null,
      contact_email: input.contact_email ?? null,
      contract_notes: input.contract_notes ?? null,
      deal_value: input.deal_value ?? null,
      renewal_date: input.renewal_date ?? null,
    })
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to create partner')
  }

  return data as Partner
}

export async function updatePartner(
  partnerId: string,
  input: Partial<Omit<CreatePartnerInput, 'event_id'>>
): Promise<Partner> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.contact_name !== undefined) updates.contact_name = input.contact_name || null
  if (input.contact_email !== undefined) updates.contact_email = input.contact_email || null
  if (input.contract_notes !== undefined) updates.contract_notes = input.contract_notes || null
  if (input.deal_value !== undefined) updates.deal_value = input.deal_value ?? null
  if (input.renewal_date !== undefined) updates.renewal_date = input.renewal_date || null

  const { data, error } = await supabase
    .from('partners')
    .update(updates)
    .eq('id', partnerId)
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update partner')
  }

  return data as Partner
}

export async function deletePartner(partnerId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', partnerId)

  if (error) {
    handleDbError(error, 'Failed to delete partner')
  }
}
