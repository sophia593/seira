// lib/db/partners.ts
// Partner CRUD operations

import { handleDbError, type SupabaseClient } from './client'
import type {
  Partner,
  PartnerWithCompletion,
  CreatePartnerInput,
} from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

export async function listPartners(
  supabase: SupabaseClient,
  orgId: string,
  options?: {
    eventId?: string
    limit?: number
    orderBy?: 'name' | 'created_at'
    ascending?: boolean
  }
): Promise<Partner[]> {
  let query = supabase
    .from('partners')
    .select('*')
    .eq('org_id', orgId)

  if (options?.eventId) {
    query = query.eq('event_id', options.eventId)
  }

  const orderColumn = options?.orderBy ?? 'name'
  query = query.order(orderColumn, {
    ascending: options?.ascending ?? true,
  })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    handleDbError(error, 'Failed to list partners')
  }

  return (data ?? []) as Partner[]
}

export async function getPartnerById(
  supabase: SupabaseClient,
  partnerId: string,
  orgId: string
): Promise<Partner | null> {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .eq('org_id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get partner')
  }

  return data as Partner
}

/**
 * Get partner with completion stats.
 * Computes deliverable counts via join/aggregation.
 */
export async function getPartnerWithCompletion(
  supabase: SupabaseClient,
  partnerId: string,
  orgId: string
): Promise<PartnerWithCompletion | null> {
  // Get base partner
  const partner = await getPartnerById(supabase, partnerId, orgId)
  if (!partner) return null

  // Get deliverable stats
  const { data: deliverables, error } = await supabase
    .from('deliverables')
    .select('id, status')
    .eq('partner_id', partnerId)

  if (error) {
    handleDbError(error, 'Failed to get partner deliverables')
  }

  const items = deliverables ?? []
  const total = items.length
  const completed = items.filter(
    (d) => d.status === 'done' || d.status === 'proved'
  ).length

  return {
    ...partner,
    total_deliverables: total,
    completed_deliverables: completed,
    completion_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * List partners for an event with completion stats.
 */
export async function listPartnersWithCompletion(
  supabase: SupabaseClient,
  orgId: string,
  eventId: string
): Promise<PartnerWithCompletion[]> {
  const partners = await listPartners(supabase, orgId, { eventId })

  const results: PartnerWithCompletion[] = []

  for (const partner of partners) {
    const withCompletion = await getPartnerWithCompletion(supabase, partner.id, orgId)
    if (withCompletion) {
      results.push(withCompletion)
    }
  }

  return results
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createPartner(
  supabase: SupabaseClient,
  orgId: string,
  input: CreatePartnerInput
): Promise<Partner> {
  const { data, error } = await supabase
    .from('partners')
    .insert({
      org_id: orgId,
      event_id: input.event_id,
      name: input.name,
      contact_name: input.contact_name ?? null,
      contact_email: input.contact_email ?? null,
      contract_notes: input.contract_notes ?? null,
    })
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to create partner')
  }

  return data as Partner
}

export async function updatePartner(
  supabase: SupabaseClient,
  partnerId: string,
  orgId: string,
  updates: Partial<Omit<Partner, 'id' | 'org_id' | 'event_id' | 'created_at' | 'updated_at'>>
): Promise<Partner> {
  const { data, error } = await supabase
    .from('partners')
    .update(updates)
    .eq('id', partnerId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update partner')
  }

  return data as Partner
}

export async function deletePartner(
  supabase: SupabaseClient,
  partnerId: string,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', partnerId)
    .eq('org_id', orgId)

  if (error) {
    handleDbError(error, 'Failed to delete partner')
  }
}
