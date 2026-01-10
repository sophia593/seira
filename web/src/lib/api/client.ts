// =============================================================================
// API Client for FastAPI Backend
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ApiClientConfig {
  baseUrl: string
  getToken: () => Promise<string | null>
}

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

// Response types matching backend contracts
export interface Conversation {
  id: string
  user_id: string
  title: string | null
  context: Record<string, unknown>
  message_count: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  tool_calls?: unknown[]
  tool_call_id?: string
  tokens_used?: number | null
  model_version?: string | null
  created_at: string
}

export interface ConversationWithMessages {
  conversation: Conversation
  messages: Message[]
}

export interface Trip {
  id: string
  title: string
  status: "draft" | "quoted" | "booked" | "completed" | "cancelled"
  destination_city: string | null
  destination_country: string | null
  event_name: string | null
  event_date: string | null
  estimated_total: number | null
  created_at: string
  updated_at: string
}

export interface TripDetail extends Trip {
  conversation_id: string | null
  notes: string | null
  event_time: string | null
  event_provider: string | null
  event_provider_id: string | null
  event_venue: string | null
  event_venue_address: string | null
  event_price_estimate: number | null
  event_purchase_url: string | null
  flight_offer_id: string | null
  flight_origin: string | null
  flight_destination: string | null
  flight_outbound_date: string | null
  flight_outbound_time: string | null
  flight_return_date: string | null
  flight_return_time: string | null
  flight_price: number | null
  flight_carrier: string | null
  flight_booking_ref: string | null
  flight_purchase_url: string | null
  hotel_name: string | null
  hotel_check_in: string | null
  hotel_check_out: string | null
  hotel_price: number | null
  hotel_purchase_url: string | null
  quoted_at: string | null
  quote_expires_at: string | null
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
  home_airport: string | null
  preferred_airlines: string[] | null
  seat_preference: string | null
  cabin_class: string | null
  budget_default: number | null
  dietary_restrictions: string[] | null
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
  const { baseUrl, getToken } = config

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

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options.signal,
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

    // Handle 401 - could trigger logout in consuming code
    if (response.status === 401) {
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

  async function stream(
    path: string,
    body: unknown,
    options: RequestOptions & { idempotencyKey?: string } = {}
  ): Promise<Response> {
    const token = await getToken()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...options.headers,
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey
    }

    const url = `${baseUrl}${path}`

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    })

    if (!response.ok) {
      await handleErrorResponse(response)
    }

    return response
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

  // Conversations
  async function getConversations(): Promise<Conversation[]> {
    return get<Conversation[]>("/api/v1/conversations")
  }

  async function getConversation(id: string): Promise<ConversationWithMessages> {
    return get<ConversationWithMessages>(`/api/v1/conversations/${id}`)
  }

  async function createConversation(data?: {
    title?: string
  }): Promise<Conversation> {
    return post<Conversation>("/api/v1/conversations", data)
  }

  async function updateConversation(
    id: string,
    data: { title?: string; context?: Record<string, unknown> }
  ): Promise<Conversation> {
    return patch<Conversation>(`/api/v1/conversations/${id}`, data)
  }

  async function deleteConversation(id: string): Promise<void> {
    return del<void>(`/api/v1/conversations/${id}`)
  }

  async function sendMessage(
    conversationId: string,
    content: string,
    options: { idempotencyKey?: string; signal?: AbortSignal } = {}
  ): Promise<Response> {
    return stream(`/api/v1/conversations/${conversationId}/messages`, {
      content,
    }, options)
  }

  async function sendChatMessage(
    message: string,
    options: { conversationId?: string; signal?: AbortSignal } = {}
  ): Promise<Response> {
    const body: Record<string, unknown> = { message }
    if (options.conversationId) {
      body.conversation_id = options.conversationId
    }
    return stream("/api/v1/chat", body, { signal: options.signal })
  }

  // Trips
  async function getTrips(): Promise<Trip[]> {
    return get<Trip[]>("/api/v1/trips")
  }

  async function getTrip(id: string): Promise<TripDetail> {
    return get<TripDetail>(`/api/v1/trips/${id}`)
  }

  async function updateTrip(
    id: string,
    data: Partial<TripDetail>
  ): Promise<TripDetail> {
    return patch<TripDetail>(`/api/v1/trips/${id}`, data)
  }

  async function deleteTrip(id: string): Promise<void> {
    return del<void>(`/api/v1/trips/${id}`)
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
    stream,

    // User
    getMe,
    updateMe,
    getPreferences,
    updatePreferences,

    // Conversations
    getConversations,
    getConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    sendMessage,
    sendChatMessage,

    // Trips
    getTrips,
    getTrip,
    updateTrip,
    deleteTrip,
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
