// lib/db/recaps.ts
// Recap report data access

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleDbError } from './client'
import type {
  RecapReport,
  RecapData,
  SeasonRecapData,
  CombinedRecapData,
  Proof,
  DeliverableCategory,
  DeliverableStatus,
} from '@/lib/types/database'

// =============================================================================
// Helpers
// =============================================================================

function isTableMissing(error: { message?: string; code?: string }): boolean {
  const msg = error.message?.toLowerCase() ?? ''
  return (
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    error.code === '42P01'
  )
}

// =============================================================================
// Read Operations
// =============================================================================

/** Fetch a published recap by share token — uses admin client (no auth needed). */
export async function getRecapByShareToken(token: string): Promise<RecapReport | null> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('recap_reports')
    .select('*')
    .eq('share_token', token)
    .eq('status', 'published')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    if (isTableMissing(error)) return null
    console.error('[Recaps] getRecapByShareToken error:', error)
    return null
  }

  return data as RecapReport
}

/** Fetch a recap by ID (authenticated). */
export async function getRecapById(recapId: string): Promise<RecapReport | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recap_reports')
    .select('*')
    .eq('id', recapId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    if (isTableMissing(error)) return null
    handleDbError(error, 'Failed to get recap')
  }

  return data as RecapReport
}

/** List all recaps for a partner, newest first. */
export async function listRecapsByPartner(partnerId: string): Promise<RecapReport[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recap_reports')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isTableMissing(error)) return []
    handleDbError(error, 'Failed to list recaps')
  }

  return (data ?? []) as RecapReport[]
}

/** List all recaps for a set of partner IDs, newest first. */
export async function listRecapsForPartnerIds(partnerIds: string[]): Promise<RecapReport[]> {
  if (partnerIds.length === 0) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recap_reports')
    .select('*')
    .in('partner_id', partnerIds)
    .order('created_at', { ascending: false })

  if (error) {
    if (isTableMissing(error)) return []
    handleDbError(error, 'Failed to list recaps for partner group')
  }

  return (data ?? []) as RecapReport[]
}

/** List all season recaps for a season, newest first. */
export async function listRecapsBySeason(seasonId: string): Promise<RecapReport[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recap_reports')
    .select('*')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isTableMissing(error)) return []
    handleDbError(error, 'Failed to list season recaps')
  }

  return (data ?? []) as RecapReport[]
}

/** List combined recaps for a partner name (org-wide), newest first. */
export async function listCombinedRecapsByPartnerName(
  orgId: string,
  partnerName: string,
): Promise<RecapReport[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recap_reports')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_combined', true)
    .ilike('partner_name', partnerName)
    .order('created_at', { ascending: false })

  if (error) {
    if (isTableMissing(error)) return []
    handleDbError(error, 'Failed to list combined recaps')
  }

  return (data ?? []) as RecapReport[]
}

// =============================================================================
// Write Operations
// =============================================================================

/** Create a new draft recap. */
export async function createRecap(
  orgId: string,
  input: {
    event_id: string
    partner_id: string
    title: string
    cover_note?: string
    generated_by: string
  }
): Promise<RecapReport> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recap_reports')
    .insert({
      org_id: orgId,
      event_id: input.event_id,
      partner_id: input.partner_id,
      title: input.title,
      cover_note: input.cover_note ?? null,
      generated_by: input.generated_by,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create recap')

  return data as RecapReport
}

/** Create a new draft season recap. Finds a representative event/partner for FK compatibility. */
export async function createSeasonRecap(
  orgId: string,
  input: {
    season_id: string
    partner_name: string
    title: string
    cover_note?: string
    generated_by: string
  }
): Promise<RecapReport> {
  const supabase = await createClient()

  // Find a representative event in the season
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('season_id', input.season_id)
    .limit(1)

  if (!events || events.length === 0) {
    throw new Error('No events found in this season')
  }

  const eventIds = (
    await supabase
      .from('events')
      .select('id')
      .eq('season_id', input.season_id)
  ).data?.map((e) => e.id) ?? [events[0].id]

  // Find a representative partner with this name in any season event
  const { data: partners } = await supabase
    .from('partners')
    .select('id')
    .in('event_id', eventIds)
    .ilike('name', input.partner_name)
    .limit(1)

  if (!partners || partners.length === 0) {
    throw new Error('No matching partner found in this season')
  }

  const { data, error } = await supabase
    .from('recap_reports')
    .insert({
      org_id: orgId,
      event_id: events[0].id,
      partner_id: partners[0].id,
      season_id: input.season_id,
      partner_name: input.partner_name,
      title: input.title,
      cover_note: input.cover_note ?? null,
      generated_by: input.generated_by,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create season recap')

  return data as RecapReport
}

/** Create a new draft combined recap (org-wide, all events). Finds a representative partner for FK compat. */
export async function createCombinedRecap(
  orgId: string,
  input: {
    partner_name: string
    title: string
    cover_note?: string
    generated_by: string
  }
): Promise<RecapReport> {
  const supabase = await createClient()

  // Find a representative partner with this name in any org event
  const { data: partners } = await supabase
    .from('partners')
    .select('id, event_id')
    .eq('org_id', orgId)
    .ilike('name', input.partner_name)
    .limit(1)

  if (!partners || partners.length === 0) {
    throw new Error('No matching partner found in this organization')
  }

  const { data, error } = await supabase
    .from('recap_reports')
    .insert({
      org_id: orgId,
      event_id: partners[0].event_id,
      partner_id: partners[0].id,
      partner_name: input.partner_name,
      is_combined: true,
      title: input.title,
      cover_note: input.cover_note ?? null,
      generated_by: input.generated_by,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create combined recap')

  return data as RecapReport
}

/** Update recap fields. */
export async function updateRecap(
  recapId: string,
  input: { title?: string; cover_note?: string; status?: string }
): Promise<RecapReport> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) updates.title = input.title
  if (input.cover_note !== undefined) updates.cover_note = input.cover_note || null
  if (input.status !== undefined) {
    updates.status = input.status
    if (input.status === 'draft') updates.published_at = null
  }

  const { data, error } = await supabase
    .from('recap_reports')
    .update(updates)
    .eq('id', recapId)
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to update recap')

  return data as RecapReport
}

/** Publish a recap — sets status and published_at. */
export async function publishRecap(recapId: string): Promise<RecapReport> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recap_reports')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', recapId)
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to publish recap')

  return data as RecapReport
}

/** Delete a recap record. */
export async function deleteRecap(recapId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('recap_reports')
    .delete()
    .eq('id', recapId)

  if (error) handleDbError(error, 'Failed to delete recap')
}

// =============================================================================
// Composite — Full recap data for rendering
// =============================================================================

/** Fetch everything needed to render a recap (authenticated context). */
export async function getRecapData(recapId: string): Promise<RecapData | null> {
  const supabase = await createClient()
  return fetchRecapData(supabase, recapId)
}

/** Fetch everything needed to render a recap (public/admin context). */
export async function getRecapDataPublic(recapId: string): Promise<RecapData | null> {
  const admin = createAdminClient()
  return fetchRecapData(admin, recapId)
}

async function fetchRecapData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  recapId: string
): Promise<RecapData | null> {
  // 1. Fetch recap
  const { data: recap, error: recapError } = await client
    .from('recap_reports')
    .select('*')
    .eq('id', recapId)
    .single()

  if (recapError || !recap) return null

  // 2. Fetch related entities in parallel
  const [orgResult, eventResult, partnerResult, delResult] = await Promise.all([
    client.from('organizations').select('name').eq('id', recap.org_id).single(),
    client.from('events').select('name, date, venue').eq('id', recap.event_id).single(),
    client.from('partners').select('name, contact_name, contact_email').eq('id', recap.partner_id).single(),
    client.from('deliverables').select('id, title, category, status, due_date').eq('partner_id', recap.partner_id).eq('event_id', recap.event_id).order('created_at', { ascending: true }),
  ])

  if (!orgResult.data || !eventResult.data || !partnerResult.data) return null

  const deliverables = (delResult.data ?? []) as Array<{
    id: string
    title: string
    category: DeliverableCategory
    status: DeliverableStatus
    due_date: string | null
  }>

  // 3. Fetch proofs for all deliverables
  const delIds = deliverables.map((d) => d.id)
  let proofs: Proof[] = []
  if (delIds.length > 0) {
    const { data: proofData } = await client
      .from('proofs')
      .select('*')
      .in('deliverable_id', delIds)
      .order('created_at', { ascending: true })

    proofs = (proofData ?? []) as Proof[]
  }

  // 4. Resolve uploader display names
  const uploaderIds = [...new Set(proofs.map((p) => p.uploaded_by).filter(Boolean))]
  const uploaderNames: Record<string, string> = {}
  if (uploaderIds.length > 0) {
    try {
      const admin = createAdminClient()
      await Promise.all(
        uploaderIds.map(async (id) => {
          try {
            const { data } = await admin.auth.admin.getUserById(id)
            if (data?.user) {
              uploaderNames[id] =
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email?.split('@')[0] ||
                'Team member'
            }
          } catch {
            // Individual lookup failed — skip
          }
        })
      )
    } catch {
      // Admin client not available — skip name resolution
    }
  }

  // 5. Build proof map with uploader names
  const proofMap: Record<string, (Proof & { uploader_name: string | null })[]> = {}
  for (const p of proofs) {
    if (!proofMap[p.deliverable_id]) proofMap[p.deliverable_id] = []
    proofMap[p.deliverable_id].push({
      ...p,
      uploader_name: uploaderNames[p.uploaded_by] ?? null,
    })
  }

  // 6. Compute stats
  const completedStatuses: DeliverableStatus[] = ['done', 'proved']
  const total = deliverables.length
  const completed = deliverables.filter((d) => completedStatuses.includes(d.status)).length
  const proved = deliverables.filter((d) => d.status === 'proved').length
  const inProgress = deliverables.filter((d) => d.status === 'in_progress').length

  const byCategory: Record<string, { total: number; completed: number }> = {}
  for (const d of deliverables) {
    if (!byCategory[d.category]) byCategory[d.category] = { total: 0, completed: 0 }
    byCategory[d.category].total++
    if (completedStatuses.includes(d.status)) byCategory[d.category].completed++
  }

  return {
    recap: recap as RecapReport,
    organization: orgResult.data as { name: string },
    event: eventResult.data as { name: string; date: string | null; venue: string | null },
    partner: partnerResult.data as { name: string; contact_name: string | null; contact_email: string | null },
    deliverables: deliverables.map((d) => ({
      ...d,
      proofs: proofMap[d.id] ?? [],
    })),
    stats: { total, completed, proved, inProgress, byCategory },
  }
}

// =============================================================================
// Composite — Season recap data for rendering
// =============================================================================

/** Fetch everything needed to render a season recap (authenticated context). */
export async function getSeasonRecapData(recapId: string): Promise<SeasonRecapData | null> {
  const supabase = await createClient()
  return fetchSeasonRecapData(supabase, recapId)
}

/** Fetch everything needed to render a season recap (public/admin context). */
export async function getSeasonRecapDataPublic(recapId: string): Promise<SeasonRecapData | null> {
  const admin = createAdminClient()
  return fetchSeasonRecapData(admin, recapId)
}

async function fetchSeasonRecapData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  recapId: string
): Promise<SeasonRecapData | null> {
  // 1. Fetch recap
  const { data: recap, error: recapError } = await client
    .from('recap_reports')
    .select('*')
    .eq('id', recapId)
    .single()

  if (recapError || !recap || !recap.season_id || !recap.partner_name) return null

  // 2. Fetch org and season in parallel
  const [orgResult, seasonResult] = await Promise.all([
    client.from('organizations').select('name').eq('id', recap.org_id).single(),
    client.from('seasons').select('name, start_date, end_date').eq('id', recap.season_id).single(),
  ])

  if (!orgResult.data || !seasonResult.data) return null

  // 3. Fetch all events in the season
  const { data: events } = await client
    .from('events')
    .select('id, name, date, venue')
    .eq('season_id', recap.season_id)
    .order('date', { ascending: true, nullsFirst: false })

  if (!events || events.length === 0) return null

  const eventIds = events.map((e: { id: string }) => e.id)

  // 4. Find all partners matching the name across season events
  const { data: partners } = await client
    .from('partners')
    .select('id, event_id, name, contact_name, contact_email')
    .in('event_id', eventIds)
    .ilike('name', recap.partner_name)

  if (!partners || partners.length === 0) return null

  const partnerIds = partners.map((p: { id: string }) => p.id)
  const partnerByEventId: Record<string, string> = {}
  for (const p of partners) {
    partnerByEventId[p.event_id] = p.id
  }

  // Use first partner's contact info
  const contactPartner = partners[0] as {
    name: string
    contact_name: string | null
    contact_email: string | null
  }

  // 5. Fetch all deliverables for those partners
  const { data: rawDeliverables } = await client
    .from('deliverables')
    .select('id, title, category, status, due_date, partner_id, event_id')
    .in('partner_id', partnerIds)
    .order('created_at', { ascending: true })

  const deliverables = (rawDeliverables ?? []) as Array<{
    id: string
    title: string
    category: DeliverableCategory
    status: DeliverableStatus
    due_date: string | null
    partner_id: string
    event_id: string
  }>

  // 6. Fetch proofs for all deliverables
  const delIds = deliverables.map((d) => d.id)
  let proofs: Proof[] = []
  if (delIds.length > 0) {
    const { data: proofData } = await client
      .from('proofs')
      .select('*')
      .in('deliverable_id', delIds)
      .order('created_at', { ascending: true })

    proofs = (proofData ?? []) as Proof[]
  }

  // 7. Resolve uploader display names
  const uploaderIds = [...new Set(proofs.map((p) => p.uploaded_by).filter(Boolean))]
  const uploaderNames: Record<string, string> = {}
  if (uploaderIds.length > 0) {
    try {
      const admin = createAdminClient()
      await Promise.all(
        uploaderIds.map(async (id) => {
          try {
            const { data } = await admin.auth.admin.getUserById(id)
            if (data?.user) {
              uploaderNames[id] =
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email?.split('@')[0] ||
                'Team member'
            }
          } catch {
            // skip
          }
        })
      )
    } catch {
      // skip
    }
  }

  // 8. Build proof map
  const proofMap: Record<string, (Proof & { uploader_name: string | null })[]> = {}
  for (const p of proofs) {
    if (!proofMap[p.deliverable_id]) proofMap[p.deliverable_id] = []
    proofMap[p.deliverable_id].push({
      ...p,
      uploader_name: uploaderNames[p.uploaded_by] ?? null,
    })
  }

  // 9. Group deliverables by event
  const eventDeliverables: Record<string, typeof deliverables> = {}
  for (const d of deliverables) {
    const eid = d.event_id
    if (!eventDeliverables[eid]) eventDeliverables[eid] = []
    eventDeliverables[eid].push(d)
  }

  const eventsWithDeliverables = events
    .filter((e: { id: string }) => partnerByEventId[e.id])
    .map((e: { id: string; name: string; date: string | null; venue: string | null }) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      venue: e.venue,
      deliverables: (eventDeliverables[e.id] ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        status: d.status,
        due_date: d.due_date,
        proofs: proofMap[d.id] ?? [],
      })),
    }))

  // 10. Flat deliverables list + aggregate stats
  const flatDeliverables = deliverables.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    status: d.status,
    due_date: d.due_date,
    proofs: proofMap[d.id] ?? [],
  }))

  const completedStatuses: DeliverableStatus[] = ['done', 'proved']
  const total = deliverables.length
  const completed = deliverables.filter((d) => completedStatuses.includes(d.status)).length
  const proved = deliverables.filter((d) => d.status === 'proved').length
  const inProgress = deliverables.filter((d) => d.status === 'in_progress').length

  const byCategory: Record<string, { total: number; completed: number }> = {}
  for (const d of deliverables) {
    if (!byCategory[d.category]) byCategory[d.category] = { total: 0, completed: 0 }
    byCategory[d.category].total++
    if (completedStatuses.includes(d.status)) byCategory[d.category].completed++
  }

  return {
    recap: recap as RecapReport,
    organization: orgResult.data as { name: string },
    season: seasonResult.data as { name: string; start_date: string | null; end_date: string | null },
    partner: {
      name: contactPartner.name,
      contact_name: contactPartner.contact_name,
      contact_email: contactPartner.contact_email,
    },
    events: eventsWithDeliverables,
    deliverables: flatDeliverables,
    stats: { total, completed, proved, inProgress, byCategory },
  }
}

// =============================================================================
// Composite — Combined recap data for rendering (all events, org-wide)
// =============================================================================

/** Fetch everything needed to render a combined recap (authenticated context). */
export async function getCombinedRecapData(recapId: string): Promise<CombinedRecapData | null> {
  const supabase = await createClient()
  return fetchCombinedRecapData(supabase, recapId)
}

/** Fetch everything needed to render a combined recap (public/admin context). */
export async function getCombinedRecapDataPublic(recapId: string): Promise<CombinedRecapData | null> {
  const admin = createAdminClient()
  return fetchCombinedRecapData(admin, recapId)
}

async function fetchCombinedRecapData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  recapId: string
): Promise<CombinedRecapData | null> {
  // 1. Fetch recap
  const { data: recap, error: recapError } = await client
    .from('recap_reports')
    .select('*')
    .eq('id', recapId)
    .single()

  if (recapError || !recap || !recap.is_combined || !recap.partner_name) return null

  // 2. Fetch org
  const { data: org } = await client
    .from('organizations')
    .select('name')
    .eq('id', recap.org_id)
    .single()

  if (!org) return null

  // 3. Fetch ALL events for this org (not bounded by season)
  const { data: events } = await client
    .from('events')
    .select('id, name, date, venue')
    .eq('org_id', recap.org_id)
    .order('date', { ascending: true, nullsFirst: false })

  if (!events || events.length === 0) return null

  const eventIds = events.map((e: { id: string }) => e.id)

  // 4. Find all partners matching the name across ALL org events
  const { data: partners } = await client
    .from('partners')
    .select('id, event_id, name, contact_name, contact_email, deal_value')
    .in('event_id', eventIds)
    .ilike('name', recap.partner_name)

  if (!partners || partners.length === 0) return null

  const partnerIds = partners.map((p: { id: string }) => p.id)
  const partnerByEventId: Record<string, string> = {}
  for (const p of partners) {
    partnerByEventId[p.event_id] = p.id
  }

  // Use first partner's contact info
  const contactPartner = partners[0] as {
    name: string
    contact_name: string | null
    contact_email: string | null
  }

  // Sum deal values
  const totalDealValue = partners.reduce(
    (sum: number, p: { deal_value: number | null }) => sum + (p.deal_value ?? 0),
    0,
  )

  // 5. Fetch all deliverables for those partners
  const { data: rawDeliverables } = await client
    .from('deliverables')
    .select('id, title, category, status, due_date, partner_id, event_id')
    .in('partner_id', partnerIds)
    .order('created_at', { ascending: true })

  const deliverables = (rawDeliverables ?? []) as Array<{
    id: string
    title: string
    category: DeliverableCategory
    status: DeliverableStatus
    due_date: string | null
    partner_id: string
    event_id: string
  }>

  // 6. Fetch proofs for all deliverables
  const delIds = deliverables.map((d) => d.id)
  let proofs: Proof[] = []
  if (delIds.length > 0) {
    const { data: proofData } = await client
      .from('proofs')
      .select('*')
      .in('deliverable_id', delIds)
      .order('created_at', { ascending: true })

    proofs = (proofData ?? []) as Proof[]
  }

  // 7. Resolve uploader display names
  const uploaderIds = [...new Set(proofs.map((p) => p.uploaded_by).filter(Boolean))]
  const uploaderNames: Record<string, string> = {}
  if (uploaderIds.length > 0) {
    try {
      const admin = createAdminClient()
      await Promise.all(
        uploaderIds.map(async (id) => {
          try {
            const { data } = await admin.auth.admin.getUserById(id)
            if (data?.user) {
              uploaderNames[id] =
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email?.split('@')[0] ||
                'Team member'
            }
          } catch {
            // skip
          }
        })
      )
    } catch {
      // skip
    }
  }

  // 8. Build proof map
  const proofMap: Record<string, (Proof & { uploader_name: string | null })[]> = {}
  for (const p of proofs) {
    if (!proofMap[p.deliverable_id]) proofMap[p.deliverable_id] = []
    proofMap[p.deliverable_id].push({
      ...p,
      uploader_name: uploaderNames[p.uploaded_by] ?? null,
    })
  }

  // 9. Group deliverables by event
  const eventDeliverables: Record<string, typeof deliverables> = {}
  for (const d of deliverables) {
    const eid = d.event_id
    if (!eventDeliverables[eid]) eventDeliverables[eid] = []
    eventDeliverables[eid].push(d)
  }

  const eventsWithDeliverables = events
    .filter((e: { id: string }) => partnerByEventId[e.id])
    .map((e: { id: string; name: string; date: string | null; venue: string | null }) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      venue: e.venue,
      deliverables: (eventDeliverables[e.id] ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        status: d.status,
        due_date: d.due_date,
        proofs: proofMap[d.id] ?? [],
      })),
    }))

  // 10. Flat deliverables list + aggregate stats
  const flatDeliverables = deliverables.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    status: d.status,
    due_date: d.due_date,
    proofs: proofMap[d.id] ?? [],
  }))

  const completedStatuses: DeliverableStatus[] = ['done', 'proved']
  const total = deliverables.length
  const completed = deliverables.filter((d) => completedStatuses.includes(d.status)).length
  const proved = deliverables.filter((d) => d.status === 'proved').length
  const inProgress = deliverables.filter((d) => d.status === 'in_progress').length

  const byCategory: Record<string, { total: number; completed: number }> = {}
  for (const d of deliverables) {
    if (!byCategory[d.category]) byCategory[d.category] = { total: 0, completed: 0 }
    byCategory[d.category].total++
    if (completedStatuses.includes(d.status)) byCategory[d.category].completed++
  }

  // 11. Compute date range
  const dates = eventsWithDeliverables
    .map((e: { date: string | null }) => e.date)
    .filter(Boolean)
    .sort() as string[]

  return {
    recap: recap as RecapReport,
    organization: org as { name: string },
    partner: {
      name: contactPartner.name,
      contact_name: contactPartner.contact_name,
      contact_email: contactPartner.contact_email,
    },
    eventCount: eventsWithDeliverables.length,
    totalDealValue,
    dateRange: {
      earliest: dates[0] ?? null,
      latest: dates[dates.length - 1] ?? null,
    },
    events: eventsWithDeliverables,
    deliverables: flatDeliverables,
    stats: { total, completed, proved, inProgress, byCategory },
  }
}
