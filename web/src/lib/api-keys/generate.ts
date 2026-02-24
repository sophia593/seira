import { randomBytes, createHash } from 'crypto'

const PREFIX = 'sk_live_'

/**
 * Generate a new API key.
 * Returns { raw, hash, prefix }.
 * - raw: full key shown once to the user
 * - hash: SHA-256 hex for storage
 * - prefix: first 12 chars for display
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const bytes = randomBytes(32)
  const raw = PREFIX + bytes.toString('base64url')

  const hash = createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 12)

  return { raw, hash, prefix }
}

/**
 * Hash a raw API key for lookup.
 */
export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
