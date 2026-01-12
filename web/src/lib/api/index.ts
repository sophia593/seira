/**
 * API Client Setup
 *
 * IMPORTANT: This file exports a CLIENT-ONLY API client.
 * - Uses browser Supabase client for auth tokens
 * - Safe for use in React components, event handlers, useEffect
 * - NOT safe for Server Components or Server Actions (use getServerApi instead)
 *
 * For server-side API calls, import from './server' instead.
 */

import { createApiClient } from "./client"
import { createClient } from "@/lib/supabase/client"

/**
 * Get the API base URL.
 * - Uses NEXT_PUBLIC_API_URL in production/preview
 * - Falls back to localhost:8000 ONLY in development
 */
function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL

  if (envUrl) {
    // Remove trailing slashes to prevent double-slash URLs
    return envUrl.replace(/\/+$/, "")
  }

  // Only allow localhost fallback in development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000"
  }

  throw new Error(
    "NEXT_PUBLIC_API_URL environment variable is required in production"
  )
}

// Lazy-initialized client to avoid SSR issues
let _api: ReturnType<typeof createApiClient> | null = null

/**
 * Get the API client for use in client components.
 * Automatically injects auth token from browser Supabase session.
 */
export function getApi() {
  if (typeof window === "undefined") {
    throw new Error(
      "getApi() can only be used in client components. " +
      "For server-side API calls, use getServerApi() from '@/lib/api/server'"
    )
  }

  if (_api) return _api

  const supabase = createClient()

  _api = createApiClient({
    baseUrl: getBaseUrl(),
    getToken: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    },
    onUnauthorized: () => {
      // Sign out and redirect to login on 401
      supabase.auth.signOut().then(() => {
        window.location.href = '/login'
      })
    },
  })

  return _api
}

// Re-export types and ApiError
export { ApiError, createApiClient } from "./client"
export type {
  ApiClient,
  ApiClientConfig,
  Conversation,
  ConversationWithMessages,
  Message,
  Trip,
  TripDetail,
  UserProfile,
  UserPreferences,
  UserWithPreferences,
} from "./client"
