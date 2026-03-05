/**
 * Next.js Middleware - Auth Session Management
 *
 * 1. Refreshes the Supabase auth session (keeps cookies fresh)
 * 2. Redirects logged-in users away from /login and /signup
 * 3. Redirects logged-out users away from protected pages to /login
 */

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ─── Session-based auth ───
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

  // Logged-in user visiting auth pages -> redirect to dashboard
  if (user) {
    if (pathname === "/login" || pathname === "/signup") {
      const redirect = request.nextUrl.searchParams.get("redirect")
      const destination = redirect && redirect.startsWith("/") ? redirect : "/dashboard"
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  // Logged-out user visiting protected pages -> redirect to /login with return URL
  if (!user) {
    if (pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
