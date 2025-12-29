/**
 * Server-side API Client
 *
 * Use this in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * Creates a new client instance per request (no caching).
 */

import { createApiClient, type ApiClient } from "./client"
import { createClient } from "@/lib/supabase/server"

/**
 * Get the API base URL.
 * - Uses NEXT_PUBLIC_API_URL in production/preview
 * - Falls back to localhost:8000 ONLY in development
 */
function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL

  if (envUrl) {
    return envUrl
  }

  // Only allow localhost fallback in development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000"
  }

  throw new Error(
    "NEXT_PUBLIC_API_URL environment variable is required in production"
  )
}

/**
 * Get an API client for server-side use.
 * Must be called within a request context (has access to cookies).
 */
export async function getServerApi(): Promise<ApiClient> {
  const supabase = await createClient()

  return createApiClient({
    baseUrl: getBaseUrl(),
    getToken: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    },
  })
}
