'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserMembership } from '@/lib/db/client'
import {
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  generateShareToken,
  revokeShareToken,
} from '@/lib/db/templates'
import { canManageTemplates } from '@/lib/permissions'
import { isUuid } from '@/lib/validation'
import { logActivity } from '@/lib/db/activity-log'
import type { OrgRole, DeliverableCategory, ProofRequired } from '@/lib/types/database'

async function getAuthenticatedOrg() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' as const }
  }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) {
    return { error: 'No organization membership' as const }
  }

  return { supabase, orgId: membership.org_id, role: membership.role as OrgRole, userId: user.id, userEmail: user.email ?? '' }
}

export async function applyTemplateAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; count?: number }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    const templateId = formData.get('template_id') as string | null
    if (!templateId || !isUuid(templateId)) return { ok: false, error: 'Invalid template ID' }

    const partnerId = formData.get('partner_id') as string | null
    if (!partnerId || !isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const eventId = formData.get('event_id') as string | null
    if (!eventId || !isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const template = await getTemplateById(auth.supabase, templateId)
    if (!template) return { ok: false, error: 'Template not found' }
    if (!template.deliverables || template.deliverables.length === 0) {
      return { ok: false, error: 'Template has no deliverables' }
    }

    const rows = template.deliverables.map((d) => ({
      partner_id: partnerId,
      event_id: eventId,
      title: d.title,
      category: d.category,
      proof_required: d.proof_required,
      notes: d.notes ?? null,
      status: 'not_started',
    }))

    const { error: insertError } = await auth.supabase
      .from('deliverables')
      .insert(rows)

    if (insertError) {
      console.error('applyTemplateAction insert error:', insertError)
      return { ok: false, error: 'Failed to create deliverables' }
    }

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true, count: rows.length }
  } catch (err) {
    console.error('applyTemplateAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to apply template' }
  }
}

// ---------------------------------------------------------------------------
// Create Template
// ---------------------------------------------------------------------------

export async function createTemplateAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageTemplates(auth.role)) {
      return { ok: false, error: 'Only owners and admins can create templates' }
    }

    const name = (formData.get('name') as string)?.trim()
    if (!name || name.length < 2) {
      return { ok: false, error: 'Template name must be at least 2 characters' }
    }

    const industry = (formData.get('industry') as string) || null
    const deliverablesJson = formData.get('deliverables') as string | null

    let deliverables: { title: string; category: DeliverableCategory; proof_required: ProofRequired; notes?: string }[] = []
    if (deliverablesJson) {
      try {
        deliverables = JSON.parse(deliverablesJson)
      } catch {
        return { ok: false, error: 'Invalid deliverables data' }
      }
    }

    if (deliverables.length === 0) {
      return { ok: false, error: 'Template must have at least one deliverable' }
    }

    const template = await createTemplate(auth.supabase, auth.orgId, {
      name,
      industry: industry || null,
      deliverables,
    })

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'created', targetType: 'template', targetId: template.id, details: { name, actor_email: auth.userEmail } })

    revalidatePath('/settings/templates')
    return { ok: true, id: template.id }
  } catch (err) {
    console.error('createTemplateAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create template' }
  }
}

// ---------------------------------------------------------------------------
// Update Template
// ---------------------------------------------------------------------------

export async function updateTemplateAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageTemplates(auth.role)) {
      return { ok: false, error: 'Only owners and admins can edit templates' }
    }

    const templateId = formData.get('template_id') as string | null
    if (!templateId || !isUuid(templateId)) {
      return { ok: false, error: 'Invalid template ID' }
    }

    const name = (formData.get('name') as string)?.trim()
    if (!name || name.length < 2) {
      return { ok: false, error: 'Template name must be at least 2 characters' }
    }

    const industry = (formData.get('industry') as string) || null
    const deliverablesJson = formData.get('deliverables') as string | null

    let deliverables: { title: string; category: DeliverableCategory; proof_required: ProofRequired; notes?: string }[] | undefined
    if (deliverablesJson) {
      try {
        deliverables = JSON.parse(deliverablesJson)
      } catch {
        return { ok: false, error: 'Invalid deliverables data' }
      }
    }

    await updateTemplate(auth.supabase, templateId, auth.orgId, {
      name,
      industry: industry || null,
      ...(deliverables ? { deliverables } : {}),
    })

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'updated', targetType: 'template', targetId: templateId, details: { name, actor_email: auth.userEmail } })

    revalidatePath('/settings/templates')
    return { ok: true }
  } catch (err) {
    console.error('updateTemplateAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update template' }
  }
}

// ---------------------------------------------------------------------------
// Delete Template
// ---------------------------------------------------------------------------

export async function deleteTemplateAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageTemplates(auth.role)) {
      return { ok: false, error: 'Only owners and admins can delete templates' }
    }

    const templateId = formData.get('template_id') as string | null
    if (!templateId || !isUuid(templateId)) {
      return { ok: false, error: 'Invalid template ID' }
    }

    await deleteTemplate(auth.supabase, templateId, auth.orgId)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'deleted', targetType: 'template', targetId: templateId, details: { actor_email: auth.userEmail } })

    revalidatePath('/settings/templates')
    return { ok: true }
  } catch (err) {
    console.error('deleteTemplateAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete template' }
  }
}

// ---------------------------------------------------------------------------
// Duplicate Template
// ---------------------------------------------------------------------------

export async function duplicateTemplateAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageTemplates(auth.role)) {
      return { ok: false, error: 'Only owners and admins can duplicate templates' }
    }

    const templateId = formData.get('template_id') as string | null
    if (!templateId || !isUuid(templateId)) {
      return { ok: false, error: 'Invalid template ID' }
    }

    const newName = (formData.get('name') as string)?.trim() || undefined

    const template = await duplicateTemplate(auth.supabase, templateId, auth.orgId, newName)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'duplicated', targetType: 'template', targetId: template.id, details: { name: newName ?? template.name, actor_email: auth.userEmail } })

    revalidatePath('/settings/templates')
    return { ok: true, id: template.id }
  } catch (err) {
    console.error('duplicateTemplateAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to duplicate template' }
  }
}

// ---------------------------------------------------------------------------
// Generate Share Token
// ---------------------------------------------------------------------------

export async function generateShareTokenAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; token?: string; url?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageTemplates(auth.role)) {
      return { ok: false, error: 'Only owners and admins can share templates' }
    }

    const templateId = formData.get('template_id') as string | null
    if (!templateId || !isUuid(templateId)) {
      return { ok: false, error: 'Invalid template ID' }
    }

    const token = await generateShareToken(auth.supabase, templateId, auth.orgId)

    revalidatePath('/settings/templates')
    return { ok: true, token, url: `/templates/shared/${token}` }
  } catch (err) {
    console.error('generateShareTokenAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to generate share link' }
  }
}

// ---------------------------------------------------------------------------
// Revoke Share Token
// ---------------------------------------------------------------------------

export async function revokeShareTokenAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageTemplates(auth.role)) {
      return { ok: false, error: 'Only owners and admins can manage share links' }
    }

    const templateId = formData.get('template_id') as string | null
    if (!templateId || !isUuid(templateId)) {
      return { ok: false, error: 'Invalid template ID' }
    }

    await revokeShareToken(auth.supabase, templateId, auth.orgId)

    revalidatePath('/settings/templates')
    return { ok: true }
  } catch (err) {
    console.error('revokeShareTokenAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to revoke share link' }
  }
}

// ---------------------------------------------------------------------------
// Import Shared Template
// ---------------------------------------------------------------------------

export async function importSharedTemplateAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageTemplates(auth.role)) {
      return { ok: false, error: 'Only owners and admins can import templates' }
    }

    const shareToken = formData.get('share_token') as string | null
    if (!shareToken) {
      return { ok: false, error: 'Missing share token' }
    }

    // Fetch source template via admin client (bypasses RLS — source may be in another org)
    const admin = createAdminClient()
    const { data: source, error: fetchErr } = await admin
      .from('templates')
      .select('*')
      .eq('share_token', shareToken)
      .single()

    if (fetchErr || !source) {
      return { ok: false, error: 'Template not found or share link is invalid' }
    }

    // Create a copy in the user's org
    const newTemplate = await createTemplate(auth.supabase, auth.orgId, {
      name: source.name,
      industry: source.industry,
      deliverables: source.deliverables,
    })

    revalidatePath('/settings/templates')
    return { ok: true, id: newTemplate.id }
  } catch (err) {
    console.error('importSharedTemplateAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to import template' }
  }
}
