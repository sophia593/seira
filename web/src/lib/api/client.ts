// =============================================================================
// API Client for FastAPI Backend
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ApiClientConfig {
  baseUrl: string
  getToken: () => Promise<string | null>
  onUnauthorized?: () => void
}

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 30000

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface UserPreferences {
  user_id: string
  notification_email: boolean
  updated_at: string
}

export interface UserWithPreferences {
  user: UserProfile
  preferences: UserPreferences
}

interface RequestOptions {
  headers?: Record<string, string>
  signal?: AbortSignal
}

// -----------------------------------------------------------------------------
// API Client
// -----------------------------------------------------------------------------

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getToken, onUnauthorized } = config

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const token = await getToken()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const url = `${baseUrl}${path}`

    // Use provided signal or create timeout signal
    const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })

    if (!response.ok) {
      await handleErrorResponse(response)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async function handleErrorResponse(response: Response): Promise<never> {
    let message = "An error occurred"
    let code: string | undefined
    let fieldErrors: Record<string, string[]> | undefined

    try {
      const data = await response.json()
      message = data.detail || data.message || message
      code = data.code
      fieldErrors = data.field_errors
    } catch {
      // Response body wasn't JSON
      message = response.statusText || message
    }

    // Handle 401 - trigger logout and throw
    if (response.status === 401) {
      onUnauthorized?.()
      throw new ApiError("Unauthorized", 401, "UNAUTHORIZED")
    }

    throw new ApiError(message, response.status, code, fieldErrors)
  }

  // ---------------------------------------------------------------------------
  // Base Methods
  // ---------------------------------------------------------------------------

  async function get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, options)
  }

  async function post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return request<T>("POST", path, body, options)
  }

  async function patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return request<T>("PATCH", path, body, options)
  }

  async function put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return request<T>("PUT", path, body, options)
  }

  async function del<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, options)
  }

  // ---------------------------------------------------------------------------
  // Typed Endpoint Methods
  // ---------------------------------------------------------------------------

  // User
  async function getMe(): Promise<UserWithPreferences> {
    return get<UserWithPreferences>("/api/v1/me")
  }

  async function updateMe(data: { name?: string }): Promise<UserProfile> {
    return patch<UserProfile>("/api/v1/me", data)
  }

  async function getPreferences(): Promise<UserPreferences> {
    return get<UserPreferences>("/api/v1/me/preferences")
  }

  async function updatePreferences(
    prefs: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    return put<UserPreferences>("/api/v1/me/preferences", prefs)
  }

  async function deleteAccount(): Promise<{ message: string; deleted: Record<string, number> }> {
    return del<{ message: string; deleted: Record<string, number> }>("/api/v1/users/me")
  }

  // ---------------------------------------------------------------------------
  // Return Client
  // ---------------------------------------------------------------------------

  return {
    // Base methods
    get,
    post,
    patch,
    put,
    delete: del,

    // User
    getMe,
    updateMe,
    getPreferences,
    updatePreferences,
    deleteAccount,
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
