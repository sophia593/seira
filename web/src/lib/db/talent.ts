import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type { Talent, CreateTalentInput, TalentCommitment, DeliverableCategory, DeliverableStatus, TalentType } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

export async function listTalent(orgId: string): Promise<Talent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('talent')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })

  if (error) handleDbError(error, 'Failed to list talent')

  return (data ?? []) as Talent[]
}

export async function getTalentById(id: string): Promise<Talent | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('talent')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) handleDbError(error, 'Failed to load talent')

  return data as Talent | null
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createTalent(
  orgId: string,
  input: CreateTalentInput
): Promise<Talent> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('talent')
    .insert({
      org_id: orgId,
      name: input.name,
      type: input.type,
      affiliation: input.affiliation ?? null,
      contact_name: input.contact_name ?? null,
      contact_email: input.contact_email ?? null,
      notes: input.notes ?? null,
      photo_url: input.photo_url ?? null,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create talent')

  return data as Talent
}

export async function updateTalent(
  id: string,
  input: Partial<CreateTalentInput>
): Promise<Talent> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.type !== undefined) updates.type = input.type
  if (input.affiliation !== undefined) updates.affiliation = input.affiliation || null
  if (input.contact_name !== undefined) updates.contact_name = input.contact_name || null
  if (input.contact_email !== undefined) updates.contact_email = input.contact_email || null
  if (input.notes !== undefined) updates.notes = input.notes || null
  if (input.photo_url !== undefined) updates.photo_url = input.photo_url || null

  const { data, error } = await supabase
    .from('talent')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to update talent')

  return data as Talent
}

export async function listDeliverablesByTalent(talentId: string): Promise<TalentCommitment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deliverables')
    .select('id, title, category, status, due_date, talent_sub_type, event_id, partner_id, events!inner(name), partners!inner(name)')
    .eq('talent_id', talentId)
    .order('created_at', { ascending: false })

  if (error) handleDbError(error, 'Failed to list deliverables for talent')

  return (data ?? []).map((row: Record<string, unknown>) => {
    const event = (Array.isArray(row.events) ? row.events[0] : row.events) as { name: string } | null
    const partner = (Array.isArray(row.partners) ? row.partners[0] : row.partners) as { name: string } | null
    return {
      id: row.id as string,
      title: row.title as string,
      category: row.category as DeliverableCategory,
      status: row.status as DeliverableStatus,
      due_date: row.due_date as string | null,
      talent_sub_type: row.talent_sub_type as TalentType | null,
      event_id: row.event_id as string,
      event_name: event?.name ?? '',
      partner_id: row.partner_id as string,
      partner_name: partner?.name ?? '',
    }
  })
}

export async function deleteTalent(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('talent')
    .delete()
    .eq('id', id)

  if (error) handleDbError(error, 'Failed to delete talent')
}
