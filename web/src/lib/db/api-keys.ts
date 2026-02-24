import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type { ApiKey, ApiKeyDisplay } from '@/lib/types/database'

// =============================================================================
// Read
// =============================================================================

export async function listApiKeysByOrg(orgId: string): Promise<ApiKeyDisplay[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, key_prefix, name, last_used_at, created_at')
    .eq('org_id', orgId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  if (error) handleDbError(error, 'Failed to list API keys')
  return (data ?? []) as ApiKeyDisplay[]
}

// =============================================================================
// Write
// =============================================================================

export async function createApiKey(
  orgId: string,
  name: string,
  keyHash: string,
  keyPrefix: string,
): Promise<ApiKey> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      org_id: orgId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create API key')
  return data as ApiKey
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)

  if (error) handleDbError(error, 'Failed to revoke API key')
}
