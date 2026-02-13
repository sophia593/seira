// lib/db/recaps.ts
// Recap report data access

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleDbError } from './client'
import type {
  RecapReport,
  RecapData,
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

/** Update recap fields. */
export async function updateRecap(
  recapId: string,
  input: { title?: string; cover_note?: string; status?: string }
): Promise<RecapReport> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) updates.title = input.title
  if (input.cover_note !== undefined) updates.cover_note = input.cover_note || null
  if (input.status !== undefined) updates.status = input.status

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

  // 4. Build proof map
  const proofMap: Record<string, Proof[]> = {}
  for (const p of proofs) {
    if (!proofMap[p.deliverable_id]) proofMap[p.deliverable_id] = []
    proofMap[p.deliverable_id].push(p)
  }

  // 5. Compute stats
  const completedStatuses: DeliverableStatus[] = ['done', 'proved']
  const total = deliverables.length
  const completed = deliverables.filter((d) => completedStatuses.includes(d.status)).length
  const proved = deliverables.filter((d) => d.status === 'proved').length

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
    stats: { total, completed, proved, byCategory },
  }
}
