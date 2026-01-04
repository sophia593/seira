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

// Track highest message count ever seen (prevents regression)
let maxMessagesEverSeen = 0

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useConversationStore = create<ConversationState>((set) => ({
  ...initialState,

  // Conversation management
  setConversation: (conversation) =>
    set({
      conversation,
      conversationId: conversation?.id ?? null,
    }),

  setConversationId: (conversationId) => set({ conversationId }),

  setMessages: (messages) =>
    set((state) => {
      console.log('[Store] setMessages called', {
        currentCount: state.messages.length,
        newCount: messages.length,
        maxEver: maxMessagesEverSeen
      })
      // Don't overwrite if we have more messages (prevents race conditions)
      if (state.messages.length > messages.length) {
        console.log('[Store] setMessages BLOCKED - would lose messages (current > new)')
        return state
      }
      // Also don't go below our high water mark
      if (maxMessagesEverSeen > messages.length) {
        console.log('[Store] setMessages BLOCKED - would go below max ever seen')
        return state
      }
      // Update high water mark
      if (messages.length > maxMessagesEverSeen) {
        maxMessagesEverSeen = messages.length
        console.log('[Store] setMessages - new max:', maxMessagesEverSeen)
      }
      return { messages }
    }),

  addMessage: (message) =>
    set((state) => {
      const newCount = state.messages.length + 1
      console.log('[Store] addMessage', { role: message.role, id: message.id, totalAfter: newCount })
      // Update high water mark
      if (newCount > maxMessagesEverSeen) {
        maxMessagesEverSeen = newCount
        console.log('[Store] addMessage - new max:', maxMessagesEverSeen)
      }
      return {
        messages: [...state.messages, message],
      }
    }),

  // Streaming actions
  startStream: () => {
    console.log('[Store] startStream')
    return set({
      isStreaming: true,
      streamingMessage: { ...initialStreamingMessage },
      error: null,
    })
  },

  appendDelta: (text) =>
    set((state) => {
      if (!state.streamingMessage) return state
      // Only log occasionally to avoid spam
      if (state.streamingMessage.content.length % 100 === 0) {
        console.log('[Store] appendDelta', { contentLength: state.streamingMessage.content.length + text.length })
      }
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
      console.log('[Store] finalizeStream called', {
        hasAssistantMessage: !!assistantMessage,
        hasStreamingMessage: !!state.streamingMessage,
        streamingContentLength: state.streamingMessage?.content?.length ?? 0,
        currentMessageCount: state.messages.length
      })

      // If no assistant message provided, create one from streaming content
      let finalMessage = assistantMessage
      if (!finalMessage && state.streamingMessage) {
        const streaming = state.streamingMessage
        if (streaming.content || streaming.toolCalls.length > 0) {
          finalMessage = {
            id: `msg-${Date.now()}`,
            conversation_id: state.conversationId ?? "",
            role: "assistant" as const,
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
          console.log('[Store] finalizeStream - created message from streaming', { id: finalMessage.id })
        }
      }

      const newMessages = finalMessage
        ? [...state.messages, finalMessage]
        : state.messages

      console.log('[Store] finalizeStream - final message count:', newMessages.length)

      // Update high water mark
      if (newMessages.length > maxMessagesEverSeen) {
        maxMessagesEverSeen = newMessages.length
        console.log('[Store] finalizeStream - new max:', maxMessagesEverSeen)
      }

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

  reset: () =>
    set((state) => {
      console.log('[Store] reset called', {
        messageCount: state.messages.length,
        hasStreamingMessage: !!state.streamingMessage,
        isStreaming: state.isStreaming,
        maxEver: maxMessagesEverSeen
      })
      // Never clear messages if we have any, are streaming, or ever had messages
      if (state.messages.length > 0 || state.streamingMessage || maxMessagesEverSeen > 0) {
        console.log('[Store] reset BLOCKED - preserving messages (had messages at some point)')
        return state // Don't reset, keep current state
      }
      console.log('[Store] reset ALLOWED - clearing state')
      return initialState
    }),
}))

// Export a function to start fresh for a new conversation (called when user clicks "New Chat")
export function startNewConversation() {
  console.log('[Store] startNewConversation - clearing high water mark and resetting')
  maxMessagesEverSeen = 0
  useConversationStore.setState({
    ...initialState,
    selectedEvent: null,
    selectedFlight: null,
    returnFlight: null,
  })
}

// Export a function to load an existing conversation (resets high water mark for the new conversation)
export function loadExistingConversation(conversationId: string) {
  console.log('[Store] loadExistingConversation - clearing for new conversation:', conversationId)
  maxMessagesEverSeen = 0
  useConversationStore.setState({
    ...initialState,
    conversationId,
    selectedEvent: null,
    selectedFlight: null,
    returnFlight: null,
  })
}

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
