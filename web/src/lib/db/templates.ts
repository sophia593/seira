// lib/db/templates.ts
// Template CRUD operations

import { handleDbError, type SupabaseClient } from './client'
import type { Template, TemplateDeliverable } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

/**
 * List templates available to an organization.
 * Includes both org-specific templates and global templates (org_id = null).
 */
export async function listTemplates(
  supabase: SupabaseClient,
  orgId: string,
  options?: {
    industry?: Template['industry']
    includeGlobal?: boolean
  }
): Promise<Template[]> {
  let query = supabase.from('templates').select('*')

  if (options?.includeGlobal !== false) {
    // Include org templates and global templates
    query = query.or(`org_id.eq.${orgId},org_id.is.null`)
  } else {
    // Only org-specific templates
    query = query.eq('org_id', orgId)
  }

  if (options?.industry) {
    query = query.eq('industry', options.industry)
  }

  query = query.order('name', { ascending: true })

  const { data, error } = await query

  if (error) {
    handleDbError(error, 'Failed to list templates')
  }

  return (data ?? []) as Template[]
}

export async function getTemplateById(
  supabase: SupabaseClient,
  templateId: string
): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get template')
  }

  return data as Template
}

/**
 * List global templates (for initial setup / onboarding).
 */
export async function listGlobalTemplates(
  supabase: SupabaseClient,
  options?: { industry?: Template['industry'] }
): Promise<Template[]> {
  let query = supabase
    .from('templates')
    .select('*')
    .is('org_id', null)

  if (options?.industry) {
    query = query.eq('industry', options.industry)
  }

  query = query.order('name', { ascending: true })

  const { data, error } = await query

  if (error) {
    handleDbError(error, 'Failed to list global templates')
  }

  return (data ?? []) as Template[]
}

// =============================================================================
// Write Operations
// =============================================================================

export interface CreateTemplateInput {
  name: string
  industry?: string | null
  deliverables: TemplateDeliverable[]
}

export async function createTemplate(
  supabase: SupabaseClient,
  orgId: string,
  input: CreateTemplateInput
): Promise<Template> {
  const { data, error } = await supabase
    .from('templates')
    .insert({
      org_id: orgId,
      name: input.name,
      industry: input.industry ?? null,
      deliverables: input.deliverables,
    })
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to create template')
  }

  return data as Template
}

export async function updateTemplate(
  supabase: SupabaseClient,
  templateId: string,
  orgId: string,
  updates: Partial<Omit<Template, 'id' | 'org_id' | 'created_at' | 'updated_at'>>
): Promise<Template> {
  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', templateId)
    .eq('org_id', orgId) // Only allow updating own templates
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update template')
  }

  return data as Template
}

export async function deleteTemplate(
  supabase: SupabaseClient,
  templateId: string,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId)
    .eq('org_id', orgId) // Only allow deleting own templates

  if (error) {
    handleDbError(error, 'Failed to delete template')
  }
}

/**
 * Duplicate a template (including global ones) to an organization.
 */
export async function duplicateTemplate(
  supabase: SupabaseClient,
  templateId: string,
  orgId: string,
  newName?: string
): Promise<Template> {
  // Get the source template
  const source = await getTemplateById(supabase, templateId)
  if (!source) {
    throw new Error('Template not found')
  }

  // Create copy for the org
  return createTemplate(supabase, orgId, {
    name: newName ?? `${source.name} (Copy)`,
    industry: source.industry,
    deliverables: source.deliverables,
  })
}

// =============================================================================
// Share Token Operations
// =============================================================================

/**
 * Get a template by its public share token.
 */
export async function getTemplateByShareToken(
  supabase: SupabaseClient,
  token: string
): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('share_token', token)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    return null
  }

  return data as Template
}

/**
 * Generate a share token for a template.
 */
export async function generateShareToken(
  supabase: SupabaseClient,
  templateId: string,
  orgId: string
): Promise<string> {
  const token = crypto.randomUUID()

  const { error } = await supabase
    .from('templates')
    .update({ share_token: token })
    .eq('id', templateId)
    .eq('org_id', orgId)

  if (error) {
    handleDbError(error, 'Failed to generate share token')
  }

  return token
}

/**
 * Revoke the share token for a template (set to null).
 */
export async function revokeShareToken(
  supabase: SupabaseClient,
  templateId: string,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .update({ share_token: null })
    .eq('id', templateId)
    .eq('org_id', orgId)

  if (error) {
    handleDbError(error, 'Failed to revoke share token')
  }
}
