// lib/db/client.ts
// Shared database client utilities

import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrganizationMember } from '@/lib/types/database'

export type { SupabaseClient }

/**
 * Get the current user's organization membership.
 * Returns the first org membership found (users typically belong to one org).
 */
export async function getUserMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<OrganizationMember | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data as OrganizationMember
}

/**
 * Get the current user's membership for a specific org.
 * Used by the layout to resolve the cookie-selected org.
 */
export async function getUserMembershipForOrg(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<OrganizationMember | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as OrganizationMember
}

/**
 * Get the current user's org_id.
 * Throws if user has no org membership.
 */
export async function requireOrgId(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const membership = await getUserMembership(supabase, userId)

  if (!membership) {
    throw new Error('User does not belong to any organization')
  }

  return membership.org_id
}

/**
 * Database error wrapper for consistent error handling.
 */
export class DbError extends Error {
  code: string

  constructor(message: string, code: string = 'DB_ERROR') {
    super(message)
    this.name = 'DbError'
    this.code = code
  }
}

/**
 * Helper to handle Supabase query errors.
 * Extracts message, code, and details from Supabase error objects for debugging.
 */
export function handleDbError(error: unknown, context: string): never {
  // Supabase errors have { message, code, details, hint }
  const err = error as Record<string, unknown> | null
  const message = (err?.message as string) ?? 'Unknown database error'
  const code = (err?.code as string) ?? undefined
  const details = (err?.details as string) ?? undefined
  const hint = (err?.hint as string) ?? undefined

  console.error(`[DB] ${context}:`, { message, code, details, hint })
  throw new DbError(`${context}: ${message}`, code ?? 'DB_ERROR')
}
