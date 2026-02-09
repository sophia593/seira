// lib/db/client.ts
// Shared database client utilities

import { createClient } from '@/lib/supabase/client'
import type { OrganizationMember } from '@/lib/types/database'

export type SupabaseClient = ReturnType<typeof createClient>

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
 */
export function handleDbError(error: unknown, context: string): never {
  const message = error instanceof Error ? error.message : 'Unknown database error'
  console.error(`[DB] ${context}:`, error)
  throw new DbError(`${context}: ${message}`)
}
