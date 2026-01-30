// =============================================================================
// Auth Callback Error Parser
//
// Reusable utility for /login, /forgot-password, /reset-password.
// Extracts error info from URL search params set by /callback route
// or by Supabase/OAuth providers directly.
// =============================================================================

export interface AuthCallbackError {
  title: string
  message: string
  action?: 'resend-verification' | 'request-reset' | 'try-again'
  code?: string
}

/**
 * Parse URL search params for auth callback errors.
 * Returns null if no error params are present.
 */
export function parseAuthCallbackError(
  params: URLSearchParams
): AuthCallbackError | null {
  // Our callback route uses "error", OAuth providers may use "error_code"
  const error =
    params.get('error') ||
    params.get('error_code') ||
    null

  // Description from OAuth providers or our legacy "message" param
  const description =
    params.get('error_description') ||
    params.get('error_message') ||
    null

  if (!error && !description) return null

  const code = (error || '').toLowerCase()

  // -------------------------------------------------------------------------
  // Codes sent by our /callback route
  // -------------------------------------------------------------------------

  if (code === 'expired' || code.includes('expired') || code.includes('invalid_grant')) {
    return {
      title: 'link expired',
      message: 'that link is no longer valid. please request a new one.',
      action: 'try-again',
      code,
    }
  }

  if (code === 'invalid-code' || code.includes('invalid') || code.includes('bad_request')) {
    return {
      title: 'invalid link',
      message: 'that link is invalid or has already been used.',
      action: 'try-again',
      code,
    }
  }

  if (code === 'missing-code') {
    return {
      title: 'missing verification code',
      message: 'the link was incomplete. please try clicking it again or request a new one.',
      action: 'try-again',
      code,
    }
  }

  if (code === 'server-error' || code.includes('server') || code.includes('500')) {
    return {
      title: 'something went wrong',
      message: 'our server had an issue. please try again in a moment.',
      action: 'try-again',
      code,
    }
  }

  // -------------------------------------------------------------------------
  // OAuth provider errors
  // -------------------------------------------------------------------------

  if (code.includes('access_denied')) {
    return {
      title: 'access denied',
      message: "the sign-in was cancelled or denied. please try again.",
      action: 'try-again',
      code,
    }
  }

  if (code.includes('otp') || code.includes('token')) {
    return {
      title: 'invalid link',
      message: 'that link is invalid or has already been used.',
      action: 'resend-verification',
      code,
    }
  }

  // -------------------------------------------------------------------------
  // Fallback: unknown error with optional description
  // -------------------------------------------------------------------------

  return {
    title: "couldn't complete authentication",
    message: description
      ? decodeURIComponent(description)
      : 'something went wrong. please try again.',
    action: 'try-again',
    code: code || undefined,
  }
}
