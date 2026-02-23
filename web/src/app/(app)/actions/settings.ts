'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization, updateOrganization } from '@/lib/db/organizations'
import { canManageContent } from '@/lib/permissions'
import { CATEGORIES } from '@/lib/constants'
import type { DeliverableCategory, OrgRole, OrgSettings } from '@/lib/types/database'

export async function updateApprovalCategoriesAction(
  categories: DeliverableCategory[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) return { ok: false, error: 'No organization membership' }
    if (!canManageContent(membership.role as OrgRole)) {
      return { ok: false, error: 'Only admins can change approval settings' }
    }

    // Validate categories
    for (const cat of categories) {
      if (!CATEGORIES.includes(cat)) {
        return { ok: false, error: `Invalid category: ${cat}` }
      }
    }

    const org = await getOrganization(supabase, membership.org_id)
    if (!org) return { ok: false, error: 'Organization not found' }

    const currentSettings = (org.settings ?? {}) as OrgSettings
    const newSettings: OrgSettings = {
      ...currentSettings,
      approval_required_categories: categories,
    }

    await updateOrganization(supabase, membership.org_id, { settings: newSettings })

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath('/events')

    return { ok: true }
  } catch (err) {
    console.error('updateApprovalCategoriesAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update settings' }
  }
}
