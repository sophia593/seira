'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createSeason, updateSeason, deleteSeason } from '@/lib/db/seasons'
import { isUuid } from '@/lib/validation'
import { canManageContent } from '@/lib/permissions'
import type { OrgRole } from '@/lib/types/database'

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

  return { orgId: membership.org_id, role: membership.role as OrgRole }
}

function str(formData: FormData, key: string): string | undefined {
  const val = formData.get(key)
  if (typeof val !== 'string' || val.trim() === '') return undefined
  return val.trim()
}

export async function createSeasonAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Season name is required' }

    const season = await createSeason(auth.orgId, {
      name,
      start_date: str(formData, 'start_date'),
      end_date: str(formData, 'end_date'),
    })

    revalidatePath('/seasons')
    revalidatePath('/dashboard')

    return { ok: true, id: season.id }
  } catch (err) {
    console.error('createSeasonAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create season' }
  }
}

export async function updateSeasonAction(
  seasonId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(seasonId)) return { ok: false, error: 'Invalid season ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Season name is required' }

    await updateSeason(seasonId, {
      name,
      start_date: str(formData, 'start_date'),
      end_date: str(formData, 'end_date'),
    })

    revalidatePath('/seasons')
    revalidatePath('/dashboard')
    revalidatePath(`/seasons/${seasonId}`)

    return { ok: true }
  } catch (err) {
    console.error('updateSeasonAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update season' }
  }
}

export async function deleteSeasonAction(
  seasonId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(seasonId)) return { ok: false, error: 'Invalid season ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    await deleteSeason(seasonId)

    revalidatePath('/seasons')
    revalidatePath('/dashboard')

    return { ok: true }
  } catch (err) {
    console.error('deleteSeasonAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete season' }
  }
}
