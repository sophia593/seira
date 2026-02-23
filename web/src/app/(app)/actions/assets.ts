'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createAsset, updateAsset, deleteAsset, seedDefaultAssets } from '@/lib/db/assets'
import { isUuid } from '@/lib/validation'
import { canEditContent, canManageContent } from '@/lib/permissions'
import { logActivity } from '@/lib/db/activity-log'
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

  return { orgId: membership.org_id, role: membership.role as OrgRole, userId: user.id, userEmail: user.email ?? '' }
}

function str(formData: FormData, key: string): string | undefined {
  const val = formData.get(key)
  if (typeof val !== 'string' || val.trim() === '') return undefined
  return val.trim()
}

export async function createAssetAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Name is required' }

    const capacityStr = str(formData, 'capacity')
    let capacity: number | null = null
    if (capacityStr !== undefined) {
      const parsed = parseInt(capacityStr, 10)
      if (isNaN(parsed) || parsed < 0) return { ok: false, error: 'Capacity must be a positive number or empty for unlimited' }
      capacity = parsed
    }

    const asset = await createAsset(auth.orgId, {
      name,
      capacity,
      notes: str(formData, 'notes'),
    })

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'created',
      targetType: 'asset',
      targetId: asset.id,
      details: { name, capacity, actor_email: auth.userEmail },
    })

    revalidatePath('/assets')

    return { ok: true, id: asset.id }
  } catch (err) {
    console.error('createAssetAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create asset' }
  }
}

export async function updateAssetAction(
  assetId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(assetId)) return { ok: false, error: 'Invalid asset ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Name is required' }

    const capacityStr = str(formData, 'capacity')
    let capacity: number | null = null
    if (capacityStr !== undefined) {
      const parsed = parseInt(capacityStr, 10)
      if (isNaN(parsed) || parsed < 0) return { ok: false, error: 'Capacity must be a positive number or empty for unlimited' }
      capacity = parsed
    }

    await updateAsset(assetId, {
      name,
      capacity,
      notes: str(formData, 'notes'),
    })

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'updated',
      targetType: 'asset',
      targetId: assetId,
      details: { name, capacity, actor_email: auth.userEmail },
    })

    revalidatePath('/assets')

    return { ok: true }
  } catch (err) {
    console.error('updateAssetAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update asset' }
  }
}

export async function deleteAssetAction(
  assetId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(assetId)) return { ok: false, error: 'Invalid asset ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    await deleteAsset(assetId)

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'deleted',
      targetType: 'asset',
      targetId: assetId,
      details: { actor_email: auth.userEmail },
    })

    revalidatePath('/assets')

    return { ok: true }
  } catch (err) {
    console.error('deleteAssetAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete asset' }
  }
}

export async function seedDefaultAssetsAction(): Promise<{ ok: boolean; error?: string; count?: number }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const assets = await seedDefaultAssets(auth.orgId)

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'batch_created',
      targetType: 'asset',
      details: { count: assets.length, actor_email: auth.userEmail },
    })

    revalidatePath('/assets')

    return { ok: true, count: assets.length }
  } catch (err) {
    console.error('seedDefaultAssetsAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to seed default assets' }
  }
}
