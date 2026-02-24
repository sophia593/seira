/**
 * Next.js Middleware - Route Protection & Auth Session Management
 *
 * This middleware runs on every request (except static assets) and:
 * 1. Authenticates /api/v1/* requests via API key (Bearer token)
 * 2. Refreshes the Supabase auth session (keeps cookies fresh)
 * 3. Redirects logged-in users away from /login and /signup to /saved
 * 4. Redirects logged-out users away from protected pages to /login
 */

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { hashApiKeyEdge } from "@/lib/api-keys/auth"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ─── API v1: authenticate via API key, skip session refresh ───
  if (pathname.startsWith("/api/v1/")) {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Missing Authorization header" } },
        { status: 401 },
      )
    }

    const rawKey = authHeader.slice(7)
    if (!rawKey.startsWith("sk_live_")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid API key format" } },
        { status: 401 },
      )
    }

    const keyHash = await hashApiKeyEdge(rawKey)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await admin
      .from("api_keys")
      .select("id, org_id, revoked_at")
      .eq("key_hash", keyHash)
      .single()

    if (error || !data || data.revoked_at) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid or revoked API key" } },
        { status: 401 },
      )
    }

    // Inject org context into request headers for route handlers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-api-org-id", data.org_id)
    requestHeaders.set("x-api-key-id", data.id)

    // Fire-and-forget: update last_used_at
    void admin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ─── Session-based auth for all other routes ───
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (important: keeps auth cookies fresh)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Logged-in user visiting auth pages -> redirect to intended destination or /saved
  if (user) {
    if (pathname === "/login" || pathname === "/signup") {
      const redirect = request.nextUrl.searchParams.get("redirect")
      const destination = redirect && redirect.startsWith("/") ? redirect : "/saved"
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  // Logged-out user visiting protected pages -> redirect to /login with return URL
  if (!user) {
    if (
      pathname.startsWith("/plan") ||
      pathname.startsWith("/saved") ||
      pathname.startsWith("/events") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/subscribe")
    ) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
