// lib/db/deliverables.ts
// Deliverable CRUD — self-contained server functions

import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type {
  Deliverable,
  DeliverableStatus,
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
      notes: input.notes ?? null,
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

/** Delete a deliverable. */
export async function deleteDeliverable(deliverableId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deliverables')
    .delete()
    .eq('id', deliverableId)

  if (error) handleDbError(error, 'Failed to delete deliverable')
}
