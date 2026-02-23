// lib/db/deliverables.ts
// Deliverable CRUD — self-contained server functions

import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type {
  Deliverable,
  DeliverableStatus,
  DeliverableCategory,
  ProofRequired,
  CreateDeliverableInput,
} from '@/lib/types/database'
import { DEFAULT_DELIVERABLE_STATUS, DEFAULT_PROOF_REQUIRED } from '@/lib/constants'

// =============================================================================
// Read
// =============================================================================

/** List deliverables for a partner, ordered by creation time (stable). */
export async function listDeliverablesByPartner(partnerId: string): Promise<Deliverable[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deliverables')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: true })

  if (error) handleDbError(error, 'Failed to list deliverables for partner')

  return (data ?? []) as Deliverable[]
}

/** List all deliverables for an event, ordered by creation time (stable). */
export async function listDeliverablesByEvent(eventId: string): Promise<Deliverable[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deliverables')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) handleDbError(error, 'Failed to list deliverables for event')

  return (data ?? []) as Deliverable[]
}

/** Get a single deliverable by ID, or null if not found. */
export async function getDeliverableById(deliverableId: string): Promise<Deliverable | null> {
  const supabase = await createClient()

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

// =============================================================================
// Export
// =============================================================================

export interface DeliverableExportRow {
  id: string
  event_name: string
  partner_name: string
  title: string
  category: DeliverableCategory
  status: DeliverableStatus
  due_date: string | null
  proof_required: ProofRequired
  notes: string | null
}

/** List deliverables for CSV export with partner and event names joined. */
export async function listDeliverablesForExport(
  orgId: string,
  filters?: { eventId?: string; seasonId?: string; partnerName?: string; category?: string; status?: string },
): Promise<DeliverableExportRow[]> {
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
    .from('deliverables')
    .select('id, title, category, status, due_date, proof_required, notes, event_id, partners!inner(name, org_id), events!inner(name)')
    .eq('partners.org_id', orgId)
    .order('event_id')
    .order('title')
    .limit(10000)

  if (filters?.eventId) {
    query = query.eq('event_id', filters.eventId)
  } else if (seasonEventIds) {
    query = query.in('event_id', seasonEventIds)
  }

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.partnerName) query = query.ilike('partners.name', filters.partnerName)

  const { data, error } = await query

  if (error) handleDbError(error, 'Failed to export deliverables')

  return (data ?? []).map((row: Record<string, unknown>) => {
    const partner = (Array.isArray(row.partners) ? row.partners[0] : row.partners) as { name: string } | null
    const event = (Array.isArray(row.events) ? row.events[0] : row.events) as { name: string } | null
    return {
      id: row.id as string,
      event_name: event?.name ?? '',
      partner_name: partner?.name ?? '',
      title: row.title as string,
      category: row.category as DeliverableCategory,
      status: row.status as DeliverableStatus,
      due_date: row.due_date as string | null,
      proof_required: row.proof_required as ProofRequired,
      notes: row.notes as string | null,
    }
  })
}

// =============================================================================
// Bulk Operations
// =============================================================================

/** Bulk-update all non-completed deliverables of a given category in an event to a new status. */
export async function bulkUpdateDeliverableStatus(
  eventId: string,
  category: DeliverableCategory,
  newStatus: DeliverableStatus,
): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deliverables')
    .update({ status: newStatus })
    .eq('event_id', eventId)
    .eq('category', category)
    .in('status', ['not_started', 'in_progress'])
    .select('id')

  if (error) handleDbError(error, 'Failed to bulk update deliverable status')

  return (data ?? []).length
}

// =============================================================================
// Write
// =============================================================================

/** Create a new deliverable. Applies defaults for status and proof_required. */
export async function createDeliverable(input: CreateDeliverableInput): Promise<Deliverable> {
  const supabase = await createClient()

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
      talent_sub_type: input.talent_sub_type ?? null,
      talent_id: input.talent_id ?? null,
      asset_id: input.asset_id ?? null,
      notes: input.notes ?? null,
      usage_scope: input.usage_scope ?? null,
      usage_territory: input.usage_territory ?? null,
      usage_duration: input.usage_duration ?? null,
      usage_expiration_date: input.usage_expiration_date ?? null,
      usage_scope_custom: input.usage_scope_custom ?? null,
      usage_territory_custom: input.usage_territory_custom ?? null,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create deliverable')

  return data as Deliverable
}

/** Update a deliverable. Cannot change partner_id or event_id. */
export async function updateDeliverable(
  deliverableId: string,
  updates: Partial<Omit<CreateDeliverableInput, 'partner_id' | 'event_id'>>
): Promise<Deliverable> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deliverables')
    .update(updates)
    .eq('id', deliverableId)
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to update deliverable')

  return data as Deliverable
}

/** Update only the status of a deliverable. */
export async function updateDeliverableStatus(
  deliverableId: string,
  status: DeliverableStatus
): Promise<Deliverable> {
  return updateDeliverable(deliverableId, { status })
}

/** Reject a deliverable: revert to done and attach rejection note. */
export async function rejectDeliverable(
  deliverableId: string,
  rejectionNote: string,
): Promise<Deliverable> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deliverables')
    .update({ status: 'done', rejection_note: rejectionNote })
    .eq('id', deliverableId)
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to reject deliverable')
  return data as Deliverable
}

/** Clear rejection note (called on approval). */
export async function clearRejectionNote(deliverableId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deliverables')
    .update({ rejection_note: null })
    .eq('id', deliverableId)

  if (error) handleDbError(error, 'Failed to clear rejection note')
}

/** Delete a deliverable. */
export async function deleteDeliverable(deliverableId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deliverables')
    .delete()
    .eq('id', deliverableId)

  if (error) handleDbError(error, 'Failed to delete deliverable')
}
