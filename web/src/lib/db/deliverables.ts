// lib/db/deliverables.ts
// Deliverable CRUD operations

import { handleDbError, type SupabaseClient } from './client'
import type {
  Deliverable,
  DeliverableStatus,
  DeliverableWithPartner,
  CreateDeliverableInput,
} from '@/lib/types/database'
import { DEFAULT_DELIVERABLE_STATUS, DEFAULT_PROOF_REQUIRED } from '@/lib/constants'

// =============================================================================
// Read Operations
// =============================================================================

export async function listDeliverables(
  supabase: SupabaseClient,
  options: {
    eventId?: string
    partnerId?: string
    status?: DeliverableStatus
    limit?: number
    orderBy?: 'due_date' | 'created_at' | 'title'
    ascending?: boolean
  }
): Promise<Deliverable[]> {
  let query = supabase.from('deliverables').select('*')

  if (options.eventId) {
    query = query.eq('event_id', options.eventId)
  }

  if (options.partnerId) {
    query = query.eq('partner_id', options.partnerId)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const orderColumn = options.orderBy ?? 'due_date'
  query = query.order(orderColumn, {
    ascending: options.ascending ?? true,
    nullsFirst: false,
  })

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    handleDbError(error, 'Failed to list deliverables')
  }

  return (data ?? []) as Deliverable[]
}

export async function getDeliverableById(
  supabase: SupabaseClient,
  deliverableId: string
): Promise<Deliverable | null> {
  const { data, error } = await supabase
    .from('deliverables')
    .select('*')
    .eq('id', deliverableId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get deliverable')
  }

  return data as Deliverable
}

/**
 * Get deliverable with partner info.
 */
export async function getDeliverableWithPartner(
  supabase: SupabaseClient,
  deliverableId: string
): Promise<DeliverableWithPartner | null> {
  const { data, error } = await supabase
    .from('deliverables')
    .select(`
      *,
      partners!inner (id, name)
    `)
    .eq('id', deliverableId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get deliverable with partner')
  }

  if (!data) return null

  // Transform the join result
  const { partners, ...deliverable } = data as Deliverable & { partners: { id: string; name: string } }

  return {
    ...deliverable,
    partner: partners,
  } as DeliverableWithPartner
}

/**
 * List deliverables with partner info for an event.
 */
export async function listDeliverablesWithPartner(
  supabase: SupabaseClient,
  eventId: string
): Promise<DeliverableWithPartner[]> {
  const { data, error } = await supabase
    .from('deliverables')
    .select(`
      *,
      partners!inner (id, name)
    `)
    .eq('event_id', eventId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    handleDbError(error, 'Failed to list deliverables with partner')
  }

  // Transform join results
  return (data ?? []).map((row) => {
    const { partners, ...deliverable } = row as Deliverable & { partners: { id: string; name: string } }
    return {
      ...deliverable,
      partner: partners,
    } as DeliverableWithPartner
  })
}

/**
 * Get overdue deliverables for an event.
 */
export async function getOverdueDeliverables(
  supabase: SupabaseClient,
  eventId: string
): Promise<DeliverableWithPartner[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('deliverables')
    .select(`
      *,
      partners!inner (id, name)
    `)
    .eq('event_id', eventId)
    .lt('due_date', today)
    .not('status', 'in', '("done","proved")')
    .order('due_date', { ascending: true })

  if (error) {
    handleDbError(error, 'Failed to get overdue deliverables')
  }

  return (data ?? []).map((row) => {
    const { partners, ...deliverable } = row as Deliverable & { partners: { id: string; name: string } }
    return {
      ...deliverable,
      partner: partners,
    } as DeliverableWithPartner
  })
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createDeliverable(
  supabase: SupabaseClient,
  input: CreateDeliverableInput
): Promise<Deliverable> {
  const { data, error } = await supabase
    .from('deliverables')
    .insert({
      partner_id: input.partner_id,
      event_id: input.event_id,
      title: input.title,
      category: input.category,
      due_date: input.due_date ?? null,
      owner_id: input.owner_id ?? null,
      status: input.status ?? DEFAULT_DELIVERABLE_STATUS,
      proof_required: input.proof_required ?? DEFAULT_PROOF_REQUIRED,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to create deliverable')
  }

  return data as Deliverable
}

export async function updateDeliverable(
  supabase: SupabaseClient,
  deliverableId: string,
  updates: Partial<Omit<Deliverable, 'id' | 'partner_id' | 'event_id' | 'created_at' | 'updated_at'>>
): Promise<Deliverable> {
  const { data, error } = await supabase
    .from('deliverables')
    .update(updates)
    .eq('id', deliverableId)
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update deliverable')
  }

  return data as Deliverable
}

export async function updateDeliverableStatus(
  supabase: SupabaseClient,
  deliverableId: string,
  status: DeliverableStatus
): Promise<Deliverable> {
  return updateDeliverable(supabase, deliverableId, { status })
}

export async function deleteDeliverable(
  supabase: SupabaseClient,
  deliverableId: string
): Promise<void> {
  const { error } = await supabase
    .from('deliverables')
    .delete()
    .eq('id', deliverableId)

  if (error) {
    handleDbError(error, 'Failed to delete deliverable')
  }
}

/**
 * Bulk create deliverables from a template.
 */
export async function createDeliverablesFromTemplate(
  supabase: SupabaseClient,
  partnerId: string,
  eventId: string,
  template: Array<{
    title: string
    category: CreateDeliverableInput['category']
    proof_required: CreateDeliverableInput['proof_required']
    notes?: string
  }>
): Promise<Deliverable[]> {
  const inserts = template.map((item) => ({
    partner_id: partnerId,
    event_id: eventId,
    title: item.title,
    category: item.category,
    status: DEFAULT_DELIVERABLE_STATUS,
    proof_required: item.proof_required ?? DEFAULT_PROOF_REQUIRED,
    notes: item.notes ?? null,
    due_date: null,
    owner_id: null,
  }))

  const { data, error } = await supabase
    .from('deliverables')
    .insert(inserts)
    .select()

  if (error) {
    handleDbError(error, 'Failed to create deliverables from template')
  }

  return (data ?? []) as Deliverable[]
}
