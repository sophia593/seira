'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { countAssetUsageInEvent } from '@/lib/db/assets'
import { isUuid } from '@/lib/validation'

export async function getAssetUsageForEventAction(
  assetId: string,
  eventId: string,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (!isUuid(assetId) || !isUuid(eventId)) return { ok: false, error: 'Invalid ID' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) return { ok: false, error: 'No organization membership' }

  try {
    const count = await countAssetUsageInEvent(assetId, eventId)
    return { ok: true, count }
  } catch {
    return { ok: false, error: 'Failed to check usage' }
  }
}
