// lib/db/proof.ts
// Proof CRUD operations

import { handleDbError, type SupabaseClient } from './client'
import type { Proof, ProofType } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

export async function listProofs(
  supabase: SupabaseClient,
  deliverableId: string
): Promise<Proof[]> {
  const { data, error } = await supabase
    .from('proofs')
    .select('*')
    .eq('deliverable_id', deliverableId)
    .order('created_at', { ascending: false })

  if (error) {
    handleDbError(error, 'Failed to list proofs')
  }

  return (data ?? []) as Proof[]
}

export async function getProofById(
  supabase: SupabaseClient,
  proofId: string
): Promise<Proof | null> {
  const { data, error } = await supabase
    .from('proofs')
    .select('*')
    .eq('id', proofId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get proof')
  }

  return data as Proof
}

/**
 * Get all proofs for an event (across all deliverables).
 */
export async function listProofsForEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<Proof[]> {
  const { data, error } = await supabase
    .from('proofs')
    .select(`
      *,
      deliverables!inner (event_id)
    `)
    .eq('deliverables.event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    handleDbError(error, 'Failed to list proofs for event')
  }

  // Extract just the proof data
  return (data ?? []).map((row) => {
    const { deliverables, ...proof } = row as Proof & { deliverables: unknown }
    return proof
  }) as Proof[]
}

/**
 * Count proofs for a deliverable.
 */
export async function countProofs(
  supabase: SupabaseClient,
  deliverableId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('proofs')
    .select('*', { count: 'exact', head: true })
    .eq('deliverable_id', deliverableId)

  if (error) {
    handleDbError(error, 'Failed to count proofs')
  }

  return count ?? 0
}

// =============================================================================
// Write Operations
// =============================================================================

export interface CreateProofInput {
  deliverable_id: string
  type: ProofType
  url: string
  file_name?: string
  note?: string
  timestamp_note?: string
  uploaded_by: string
}

export async function createProof(
  supabase: SupabaseClient,
  input: CreateProofInput
): Promise<Proof> {
  const { data, error } = await supabase
    .from('proofs')
    .insert({
      deliverable_id: input.deliverable_id,
      type: input.type,
      url: input.url,
      file_name: input.file_name ?? null,
      note: input.note ?? null,
      timestamp_note: input.timestamp_note ?? null,
      uploaded_by: input.uploaded_by,
    })
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to create proof')
  }

  return data as Proof
}

export async function updateProof(
  supabase: SupabaseClient,
  proofId: string,
  updates: Partial<Pick<Proof, 'note' | 'timestamp_note'>>
): Promise<Proof> {
  const { data, error } = await supabase
    .from('proofs')
    .update(updates)
    .eq('id', proofId)
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update proof')
  }

  return data as Proof
}

export async function deleteProof(
  supabase: SupabaseClient,
  proofId: string
): Promise<void> {
  const { error } = await supabase
    .from('proofs')
    .delete()
    .eq('id', proofId)

  if (error) {
    handleDbError(error, 'Failed to delete proof')
  }
}

/**
 * Delete all proofs for a deliverable.
 */
export async function deleteProofsForDeliverable(
  supabase: SupabaseClient,
  deliverableId: string
): Promise<void> {
  const { error } = await supabase
    .from('proofs')
    .delete()
    .eq('deliverable_id', deliverableId)

  if (error) {
    handleDbError(error, 'Failed to delete proofs for deliverable')
  }
}
