import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type { Partner, CreatePartnerInput } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

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
