// lib/db/proof.ts
// Proof data access — file-based proof records

import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type {
  Proof,
  Deliverable,
  ProofWithDeliverable,
  CreateProofRecordInput,
} from '@/lib/types/database'

// =============================================================================
// Helpers
// =============================================================================

/** Returns true if the error indicates the proofs table doesn't exist yet. */
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

/** List all proofs for a deliverable, newest first. */
export async function listProofByDeliverable(deliverableId: string): Promise<Proof[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proofs')
    .select('*')
    .eq('deliverable_id', deliverableId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isTableMissing(error)) return []
    handleDbError(error, 'Failed to list proofs for deliverable')
  }

  return (data ?? []) as Proof[]
}

/** List all proofs for a partner's deliverables, with deliverable metadata. */
export async function listProofByPartner(partnerId: string): Promise<ProofWithDeliverable[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proofs')
    .select(`
      *,
      deliverables!inner (id, title, partner_id, event_id)
    `)
    .eq('deliverables.partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isTableMissing(error)) return []
    handleDbError(error, 'Failed to list proofs for partner')
  }

  return (data ?? []).map((row) => {
    const { deliverables, ...proof } = row as Proof & {
      deliverables: Pick<Deliverable, 'id' | 'title' | 'partner_id' | 'event_id'>
    }
    return { ...proof, deliverable: deliverables } as ProofWithDeliverable
  })
}

/**
 * Batch count proofs per deliverable.
 * Returns a map of deliverable_id → proof count.
 */
export async function countProofByDeliverable(
  deliverableIds: string[]
): Promise<Record<string, number>> {
  if (deliverableIds.length === 0) return {}

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proofs')
    .select('deliverable_id')
    .in('deliverable_id', deliverableIds)

  if (error) {
    if (isTableMissing(error)) return {}
    handleDbError(error, 'Failed to count proofs by deliverable')
  }

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.deliverable_id] = (counts[row.deliverable_id] ?? 0) + 1
  }
  return counts
}

// =============================================================================
// Write Operations
// =============================================================================

/** Insert a new proof record. */
export async function createProofRecord(input: CreateProofRecordInput): Promise<Proof> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proofs')
    .insert({
      deliverable_id: input.deliverable_id,
      org_id: input.org_id,
      file_url: input.file_url,
      file_name: input.file_name,
      file_type: input.file_type,
      file_size: input.file_size,
      uploaded_by: input.uploaded_by,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create proof record')

  return data as Proof
}

/** Delete a proof record (does NOT delete the storage file). */
export async function deleteProofRecord(proofId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('proofs')
    .delete()
    .eq('id', proofId)

  if (error) handleDbError(error, 'Failed to delete proof record')
}
