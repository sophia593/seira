'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listApiKeysByOrg, createApiKey, revokeApiKey } from '@/lib/db/api-keys'
import { generateApiKey } from '@/lib/api-keys/generate'
import { canManageContent } from '@/lib/permissions'
import { isUuid } from '@/lib/validation'
import type { OrgRole, ApiKeyDisplay } from '@/lib/types/database'

const MAX_KEYS_PER_ORG = 10

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

  return { orgId: membership.org_id, role: membership.role as OrgRole }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createApiKeyAction(
  name: string,
): Promise<{ ok: boolean; error?: string; rawKey?: string; key?: ApiKeyDisplay }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can manage API keys' }

    const trimmedName = name.trim()
    if (!trimmedName) return { ok: false, error: 'Name is required' }
    if (trimmedName.length > 64) return { ok: false, error: 'Name must be 64 characters or fewer' }

    const existing = await listApiKeysByOrg(auth.orgId)
    if (existing.length >= MAX_KEYS_PER_ORG) {
      return { ok: false, error: `Maximum of ${MAX_KEYS_PER_ORG} API keys per workspace` }
    }

    const { raw, hash, prefix } = generateApiKey()
    const key = await createApiKey(auth.orgId, trimmedName, hash, prefix)

    revalidatePath('/settings')
    return {
      ok: true,
      rawKey: raw,
      key: {
        id: key.id,
        key_prefix: key.key_prefix,
        name: key.name,
        last_used_at: key.last_used_at,
        created_at: key.created_at,
      },
    }
  } catch (err) {
    console.error('createApiKeyAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create API key' }
  }
}

// ---------------------------------------------------------------------------
// Revoke
// ---------------------------------------------------------------------------

export async function revokeApiKeyAction(
  keyId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(keyId)) return { ok: false, error: 'Invalid key ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can manage API keys' }

    await revokeApiKey(keyId)
    revalidatePath('/settings')
    return { ok: true }
  } catch (err) {
    console.error('revokeApiKeyAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to revoke API key' }
  }
}
