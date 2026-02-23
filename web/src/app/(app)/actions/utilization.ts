'use server'

import { countAssetUsageInEvent } from '@/lib/db/assets'
import { isUuid } from '@/lib/validation'

export async function getAssetUsageForEventAction(
  assetId: string,
  eventId: string,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (!isUuid(assetId) || !isUuid(eventId)) return { ok: false, error: 'Invalid ID' }
  try {
    const count = await countAssetUsageInEvent(assetId, eventId)
    return { ok: true, count }
  } catch {
    return { ok: false, error: 'Failed to check usage' }
  }
}
