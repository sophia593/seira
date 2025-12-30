import { create } from "zustand"
import type { Message, Conversation } from "@/lib/api/client"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ToolCall {
  id: string
  name: string
  input?: Record<string, unknown>
  result?: Record<string, unknown>
  isError?: boolean
  status: "pending" | "running" | "complete" | "error"
}

export interface StreamingMessage {
  content: string
  toolCalls: ToolCall[]
}

// Event and flight types for selection
export interface SelectedEvent {
  id: string
  name: string
  date: string
  venue: string
  city: string
  imageUrl?: string
  priceRange?: string
  url?: string
}

export interface SelectedFlight {
  id: string
  airline: string
  flightNumber: string
  departure: {
    airport: string
    time: string
    date: string
  }
  arrival: {
    airport: string
    time: string
    date: string
  }
  price: number
  duration: string
}

interface ConversationState {
  // Current conversation
  conversationId: string | null
  conversation: Conversation | null
  messages: Message[]

  // Streaming state
  isStreaming: boolean
  streamingMessage: StreamingMessage | null
  error: string | null

  // Trip creation selection state
  selectedEvent: SelectedEvent | null
  selectedFlight: SelectedFlight | null
  returnFlight: SelectedFlight | null

  // Actions
  setConversation: (conversation: Conversation | null) => void
  setConversationId: (id: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void

  // Streaming actions
  startStream: () => void
  appendDelta: (text: string) => void
  addToolCall: (id: string, name: string) => void
  updateToolInput: (id: string, input: Record<string, unknown>) => void
  updateToolResult: (id: string, result: Record<string, unknown>, isError?: boolean) => void
  finalizeStream: (assistantMessage?: Message) => void
  setError: (error: string | null) => void
  abortStream: () => void

  // Selection actions
  selectEvent: (event: SelectedEvent | null) => void
  selectFlight: (flight: SelectedFlight | null) => void
  selectReturnFlight: (flight: SelectedFlight | null) => void
  clearSelections: () => void

  // Reset
  reset: () => void
}

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialStreamingMessage: StreamingMessage = {
  content: "",
  toolCalls: [],
}

const initialState = {
  conversationId: null,
  conversation: null,
  messages: [],
  isStreaming: false,
  streamingMessage: null,
  error: null,
  selectedEvent: null,
  selectedFlight: null,
  returnFlight: null,
}

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useConversationStore = create<ConversationState>((set, get) => ({
  ...initialState,

  // Conversation management
  setConversation: (conversation) =>
    set({
      conversation,
      conversationId: conversation?.id ?? null,
    }),

  setConversationId: (conversationId) => set({ conversationId }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  // Streaming actions
  startStream: () =>
    set({
      isStreaming: true,
      streamingMessage: { ...initialStreamingMessage },
      error: null,
    }),

  appendDelta: (text) =>
    set((state) => {
      if (!state.streamingMessage) return state
      return {
        streamingMessage: {
          ...state.streamingMessage,
          content: state.streamingMessage.content + text,
        },
      }
    }),

  addToolCall: (id, name) =>
    set((state) => {
      if (!state.streamingMessage) return state
      return {
        streamingMessage: {
          ...state.streamingMessage,
          toolCalls: [
            ...state.streamingMessage.toolCalls,
            { id, name, status: "running" as const },
          ],
        },
      }
    }),

  updateToolInput: (id, input) =>
    set((state) => {
      if (!state.streamingMessage) return state
      return {
        streamingMessage: {
          ...state.streamingMessage,
          toolCalls: state.streamingMessage.toolCalls.map((tc) =>
            tc.id === id ? { ...tc, input } : tc
          ),
        },
      }
    }),

  updateToolResult: (id, result, isError = false) =>
    set((state) => {
      if (!state.streamingMessage) return state
      return {
        streamingMessage: {
          ...state.streamingMessage,
          toolCalls: state.streamingMessage.toolCalls.map((tc) =>
            tc.id === id
              ? {
                  ...tc,
                  result,
                  isError,
                  status: isError ? ("error" as const) : ("complete" as const),
                }
              : tc
          ),
        },
      }
    }),

  finalizeStream: (assistantMessage) =>
    set((state) => {
      const newMessages = assistantMessage
        ? [...state.messages, assistantMessage]
        : state.messages

      return {
        isStreaming: false,
        streamingMessage: null,
        messages: newMessages,
      }
    }),

  setError: (error) =>
    set({
      error,
      isStreaming: false,
    }),

  abortStream: () =>
    set({
      isStreaming: false,
      streamingMessage: null,
    }),

  // Selection actions
  selectEvent: (event) => set({ selectedEvent: event }),

  selectFlight: (flight) => set({ selectedFlight: flight }),

  selectReturnFlight: (flight) => set({ returnFlight: flight }),

  clearSelections: () =>
    set({
      selectedEvent: null,
      selectedFlight: null,
      returnFlight: null,
    }),

  reset: () => set(initialState),
}))

// -----------------------------------------------------------------------------
// Selectors
// -----------------------------------------------------------------------------

// Cached empty arrays to avoid infinite loop in SSR hydration
const EMPTY_TOOL_CALLS: ToolCall[] = []
const EMPTY_MESSAGES: Message[] = []

export const selectConversationId = (state: ConversationState) =>
  state.conversationId

export const selectMessages = (state: ConversationState) =>
  state.messages.length > 0 ? state.messages : EMPTY_MESSAGES

export const selectIsStreaming = (state: ConversationState) => state.isStreaming

export const selectStreamingMessage = (state: ConversationState) =>
  state.streamingMessage

export const selectStreamingContent = (state: ConversationState) =>
  state.streamingMessage?.content ?? ""

export const selectStreamingToolCalls = (state: ConversationState) =>
  state.streamingMessage?.toolCalls ?? EMPTY_TOOL_CALLS

export const selectError = (state: ConversationState) => state.error

// Combined selector for displaying messages including streaming
export const selectDisplayMessages = (state: ConversationState) => {
  const messages = state.messages
  const streaming = state.streamingMessage

  if (!streaming || (!streaming.content && streaming.toolCalls.length === 0)) {
    return messages
  }

  // Create a temporary "streaming" message for display
  const streamingDisplay: Message = {
    id: "streaming",
    conversation_id: state.conversationId ?? "",
    role: "assistant",
    content: streaming.content,
    tool_calls: streaming.toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.name,
      input: tc.input ?? {},
      result: tc.result,
      is_error: tc.isError,
    })),
    created_at: new Date().toISOString(),
  }

  return [...messages, streamingDisplay]
}

// Selection selectors
export const selectSelectedEvent = (state: ConversationState) =>
  state.selectedEvent

export const selectSelectedFlight = (state: ConversationState) =>
  state.selectedFlight

export const selectReturnFlight = (state: ConversationState) =>
  state.returnFlight

export const selectHasSelections = (state: ConversationState) =>
  state.selectedEvent !== null || state.selectedFlight !== null
