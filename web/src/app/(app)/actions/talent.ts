'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createTalent, updateTalent, deleteTalent } from '@/lib/db/talent'
import { isUuid } from '@/lib/validation'
import { canEditContent, canManageContent } from '@/lib/permissions'
import { logActivity } from '@/lib/db/activity-log'
import type { OrgRole, TalentType } from '@/lib/types/database'

const VALID_TYPES: TalentType[] = ['player', 'artist', 'influencer', 'speaker']

async function getAuthenticatedOrg() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) {
    return { error: 'No organization membership' }
  }

  return { supabase, orgId: membership.org_id, role: membership.role as OrgRole, userId: user.id, userEmail: user.email ?? '' }
}

function str(formData: FormData, key: string): string | undefined {
  const val = formData.get(key)
  if (typeof val !== 'string' || val.trim() === '') return undefined
  return val.trim()
}

export async function createTalentAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Name is required' }

    const type = str(formData, 'type') as TalentType | undefined
    if (!type || !VALID_TYPES.includes(type)) return { ok: false, error: 'Invalid talent type' }

    const talent = await createTalent(auth.orgId, {
      name,
      type,
      affiliation: str(formData, 'affiliation'),
      contact_name: str(formData, 'contact_name'),
      contact_email: str(formData, 'contact_email'),
      notes: str(formData, 'notes'),
      photo_url: str(formData, 'photo_url'),
    })

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'created',
      targetType: 'talent',
      targetId: talent.id,
      details: { name, type, actor_email: auth.userEmail },
    })

    revalidatePath('/talent')

    return { ok: true, id: talent.id }
  } catch (err) {
    console.error('createTalentAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create talent' }
  }
}

export async function updateTalentAction(
  talentId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(talentId)) return { ok: false, error: 'Invalid talent ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Name is required' }

    const type = str(formData, 'type') as TalentType | undefined
    if (!type || !VALID_TYPES.includes(type)) return { ok: false, error: 'Invalid talent type' }

    await updateTalent(talentId, {
      name,
      type,
      affiliation: str(formData, 'affiliation'),
      contact_name: str(formData, 'contact_name'),
      contact_email: str(formData, 'contact_email'),
      notes: str(formData, 'notes'),
      photo_url: str(formData, 'photo_url'),
    })

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'updated',
      targetType: 'talent',
      targetId: talentId,
      details: { name, type, actor_email: auth.userEmail },
    })

    revalidatePath('/talent')

    return { ok: true }
  } catch (err) {
    console.error('updateTalentAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update talent' }
  }
}

export async function deleteTalentAction(
  talentId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(talentId)) return { ok: false, error: 'Invalid talent ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    await deleteTalent(talentId)

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'deleted',
      targetType: 'talent',
      targetId: talentId,
      details: { actor_email: auth.userEmail },
    })

    revalidatePath('/talent')

    return { ok: true }
  } catch (err) {
    console.error('deleteTalentAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete talent' }
  }
}
