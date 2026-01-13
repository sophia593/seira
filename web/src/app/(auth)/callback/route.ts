import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// =============================================================================
// Types
// =============================================================================

type AuthErrorType =
  | "missing-code"
  | "invalid-code"
  | "expired"
  | "server-error"
  | "unknown"

// =============================================================================
// Helpers
// =============================================================================

function getErrorType(error: Error | null): AuthErrorType {
  if (!error) return "unknown"

  const message = error.message?.toLowerCase() || ""

  if (message.includes("expired") || message.includes("invalid_grant")) {
    return "expired"
  }

  if (message.includes("invalid") || message.includes("bad_request")) {
    return "invalid-code"
  }

  if (message.includes("server") || message.includes("500")) {
    return "server-error"
  }

  return "unknown"
}

function logAuthAttempt(
  success: boolean,
  details: {
    hasCode: boolean
    errorType?: AuthErrorType
    errorMessage?: string
  }
) {
  if (process.env.NODE_ENV !== "development") return

  const timestamp = new Date().toISOString()
  const status = success ? "✅ SUCCESS" : "❌ FAILED"

  console.log(`[auth/callback] ${timestamp} ${status}`, {
    ...details,
    // Don't log the actual code for security
  })
}

// =============================================================================
// Route Handler
// =============================================================================

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // ---------------------------------------------------------------------------
  // No code provided
  // ---------------------------------------------------------------------------

  if (!code) {
    logAuthAttempt(false, {
      hasCode: false,
      errorType: "missing-code"
    })

    return NextResponse.redirect(
      `${origin}/login?error=missing-code`
    )
  }

  // ---------------------------------------------------------------------------
  // Exchange code for session
  // ---------------------------------------------------------------------------

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const errorType = getErrorType(error)

      logAuthAttempt(false, {
        hasCode: true,
        errorType,
        errorMessage: error.message,
      })

      return NextResponse.redirect(
        `${origin}/login?error=${errorType}`
      )
    }

    // -------------------------------------------------------------------------
    // Success - redirect to chat
    // -------------------------------------------------------------------------

    logAuthAttempt(true, { hasCode: true })

    return NextResponse.redirect(`${origin}/chat`)

  } catch (err) {
    // -------------------------------------------------------------------------
    // Unexpected error
    // -------------------------------------------------------------------------

    const error = err instanceof Error ? err : new Error("Unknown error")

    logAuthAttempt(false, {
      hasCode: true,
      errorType: "server-error",
      errorMessage: error.message,
    })

    return NextResponse.redirect(
      `${origin}/login?error=server-error`
    )
  }
}
