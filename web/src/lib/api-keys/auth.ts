import { createAdminClient } from '@/lib/supabase/admin'
import { hashApiKey } from './generate'
import { NextResponse } from 'next/server'

export interface AuthResult {
  orgId: string
  keyId: string
}

/** Edge-compatible SHA-256 hash (same output as Node hashApiKey). */
export async function hashApiKeyEdge(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Read middleware-injected API auth headers. Returns null if missing. */
export function getApiAuth(request: Request): AuthResult | null {
  const orgId = request.headers.get('x-api-org-id')
  const keyId = request.headers.get('x-api-key-id')
  if (!orgId || !keyId) return null
  return { orgId, keyId }
}

/**
 * Authenticate an API request via Bearer token.
 * Returns { orgId, keyId } on success, or a NextResponse error.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' } },
      { status: 401 },
    )
  }

  const rawKey = authHeader.slice(7)
  if (!rawKey.startsWith('sk_live_')) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid API key format' } },
      { status: 401 },
    )
  }

  const keyHash = hashApiKey(rawKey)
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('api_keys')
    .select('id, org_id, revoked_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 },
    )
  }

  if (data.revoked_at) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'API key has been revoked' } },
      { status: 401 },
    )
  }

  // Fire-and-forget: update last_used_at
  void admin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return { orgId: data.org_id, keyId: data.id }
}
