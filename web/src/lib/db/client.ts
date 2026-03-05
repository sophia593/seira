// lib/db/client.ts
// Shared database client utilities

import type { SupabaseClient } from '@supabase/supabase-js'

export type { SupabaseClient }

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
  const err = error as Record<string, unknown> | null
  const message = (err?.message as string) ?? 'Unknown database error'
  const code = (err?.code as string) ?? undefined
  const details = (err?.details as string) ?? undefined
  const hint = (err?.hint as string) ?? undefined

  console.error(`[DB] ${context}:`, { message, code, details, hint })
  throw new DbError(`${context}: ${message}`, code ?? 'DB_ERROR')
}
