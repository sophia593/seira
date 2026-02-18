import { Resend } from 'resend'

let resendInstance: Resend | null = null

/**
 * Get a Resend client instance. Returns null if RESEND_API_KEY is not set.
 * Callers should treat email as non-critical — same pattern as tryCreateAdminClient().
 */
export function getResend(): Resend | null {
  if (resendInstance) return resendInstance
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  resendInstance = new Resend(key)
  return resendInstance
}

export const EMAIL_FROM = 'Seira <notifications@seira.global>'
