'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization, updateOrganization } from '@/lib/db/organizations'
import type { OrgRole, OrgSettings, OrgType } from '@/lib/types/database'

const VALID_ORG_TYPES: OrgType[] = ['sports', 'music', 'festival', 'conference', 'university', 'other']

export async function updateOrgProfileAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) return { ok: false, error: 'No organization membership' }

    const name = (formData.get('name') as string)?.trim()
    if (!name || name.length < 2) return { ok: false, error: 'Workspace name must be at least 2 characters' }
    if (name.length > 60) return { ok: false, error: 'Workspace name must be 60 characters or fewer' }

    const orgType = formData.get('org_type') as string | null
    if (!orgType || !VALID_ORG_TYPES.includes(orgType as OrgType)) {
      return { ok: false, error: 'Please select an organization type' }
    }

    const org = await getOrganization(supabase, membership.org_id)
    if (!org) return { ok: false, error: 'Organization not found' }

    const currentSettings = (org.settings ?? {}) as OrgSettings
    const newSettings: OrgSettings = {
      ...currentSettings,
      org_type: orgType as OrgType,
    }

    await updateOrganization(supabase, membership.org_id, { name, settings: newSettings })

    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/onboarding')

    return { ok: true }
  } catch (err) {
    console.error('updateOrgProfileAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update workspace' }
  }
}

export async function completeOnboardingAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) return { ok: false, error: 'No organization membership' }

    const org = await getOrganization(supabase, membership.org_id)
    if (!org) return { ok: false, error: 'Organization not found' }

    const currentSettings = (org.settings ?? {}) as OrgSettings
    const newSettings: OrgSettings = {
      ...currentSettings,
      onboarding_completed: true,
    }

    await updateOrganization(supabase, membership.org_id, { settings: newSettings })

    revalidatePath('/')
    revalidatePath('/dashboard')

    return { ok: true }
  } catch (err) {
    console.error('completeOnboardingAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to complete onboarding' }
  }
}
