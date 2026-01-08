"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useStreaming } from "@/hooks/use-streaming"
import { getApi, type Message } from "@/lib/api"
import { useUserStore } from "@/stores/user-store"
import {
  useConversationStore,
  selectMessages,
  selectIsStreaming,
  selectStreamingContent,
  selectStreamingToolCalls,
  selectSelectedEvent,
  selectSelectedFlight,
  selectError,
  selectConversationId,
  loadExistingConversation,
} from "@/stores/conversation-store"
import { MessageList } from "./message-list"
import { MessageListSkeleton } from "./message-skeleton"
import { ChatInput } from "./chat-input"
import { Bug } from "lucide-react"

interface ChatInterfaceProps {
  conversationId?: string
  /** Initial prompt to pre-fill in the input */
  initialPrompt?: string
}

/**
 * Merge tool results from "tool" role messages into assistant tool_calls.
 *
 * When loaded from DB:
 * - Assistant messages have tool_calls with {id, name, input} but no result
 * - Tool results are stored as separate messages with role="tool"
 *
 * This function merges them so tool results display correctly.
 */
function mergeToolResults(messages: Message[]): Message[] {
  // Build a map of tool_call_id -> result from tool messages
  const toolResults = new Map<string, unknown>()

  for (const msg of messages) {
    if (msg.role === "tool" && msg.tool_call_id && msg.content) {
      try {
        // Tool results are stored as JSON strings
        const parsed = JSON.parse(msg.content)
        toolResults.set(msg.tool_call_id, parsed)
      } catch {
        // If not valid JSON, use as-is
        toolResults.set(msg.tool_call_id, { raw: msg.content })
      }
    }
  }

  // Merge results into assistant tool_calls
  return messages.map((msg) => {
    if (msg.role === "assistant" && msg.tool_calls && Array.isArray(msg.tool_calls)) {
      const mergedToolCalls = (msg.tool_calls as Array<Record<string, unknown>>).map((tc) => {
        const result = toolResults.get(tc.id as string)
        if (result) {
          return { ...tc, result }
        }
        return tc
      })
      return { ...msg, tool_calls: mergedToolCalls }
    }
    return msg
  })
}

export function ChatInterface({ conversationId, initialPrompt }: ChatInterfaceProps) {
  const router = useRouter()
  const resetUser = useUserStore((state) => state.reset)

  const [isLoading, setIsLoading] = useState(false)
  const [scrollTrigger, setScrollTrigger] = useState(0)
  const lastMessageRef = useRef<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Debug: Log when component mounts/unmounts
  useEffect(() => {
    console.log('[ChatInterface] MOUNTED', { conversationId })
    return () => {
      console.log('[ChatInterface] UNMOUNTED', { conversationId })
    }
  }, [])

  // Store state
  const messages = useConversationStore(selectMessages)
  const isStreaming = useConversationStore(selectIsStreaming)
  const storeConversationId = useConversationStore(selectConversationId)

  // Debug: Log when messages change
  useEffect(() => {
    console.log('[ChatInterface] Messages changed:', messages.length, messages.map(m => ({ id: m.id, role: m.role })))
  }, [messages])
  const streamingContent = useConversationStore(selectStreamingContent)
  const pendingToolCalls = useConversationStore(selectStreamingToolCalls)
  const selectedEvent = useConversationStore(selectSelectedEvent)
  const selectedFlight = useConversationStore(selectSelectedFlight)
  const storeError = useConversationStore(selectError)

  // Store actions
  const {
    setConversationId,
    setMessages,
    setConversation,
    addMessage,
    startStream,
    appendDelta,
    addToolCall,
    updateToolInput,
    updateToolResult,
    finalizeStream,
    selectFlight,
    setError,
    reset,
  } = useConversationStore()

  // Track loaded conversation to avoid duplicate fetches
  const loadedConversationId = useRef<string | null>(null)

  // Load conversation history when conversationId changes
  useEffect(() => {
    // No conversation ID - reset for fresh chat
    if (!conversationId) {
      if (loadedConversationId.current !== null) {
        loadedConversationId.current = null
        reset()
      }
      return
    }

    // Already loaded this conversation
    if (loadedConversationId.current === conversationId) {
      return
    }

    // If we're streaming, don't interrupt
    const storeState = useConversationStore.getState()
    if (storeState.isStreaming) {
      return
    }

    // Mark as loading this conversation
    loadedConversationId.current = conversationId

    // Clear state for the new conversation
    loadExistingConversation(conversationId)

    let cancelled = false

    async function loadConversation() {
      setIsLoading(true)
      try {
        const api = getApi()
        const data = await api.getConversation(conversationId!)

        if (cancelled) return

        // Merge tool results from "tool" messages into assistant tool_calls
        const processedMessages = mergeToolResults(data.messages)

        setConversation(data.conversation)
        setMessages(processedMessages)
      } catch (err) {
        if (cancelled) return
        console.error("Failed to load conversation:", err)
        setError("Failed to load conversation")
        // Reset loaded ID so user can retry
        loadedConversationId.current = null
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadConversation()

    return () => {
      cancelled = true
    }
  }, [conversationId, setConversation, setMessages, setError, reset])

  // Streaming hook with callbacks
  const { sendMessage, abort } = useStreaming({
    onStart: ({ conversation_id }) => {
      if (conversation_id && !conversationId) {
        setConversationId(conversation_id)
        // Update URL without navigation so refresh/share works
        window.history.replaceState(
          { ...window.history.state },
          '',
          `/chat/${conversation_id}`
        )
        // Update ref so we don't try to reload this conversation
        loadedConversationId.current = conversation_id
      }
    },
    onText: ({ text }) => {
      appendDelta(text)
    },
    onToolStart: ({ id, name }) => {
      addToolCall(id, name)
    },
    onToolInput: ({ id, input }) => {
      updateToolInput(id, input)
    },
    onToolResult: ({ id, result, is_error }) => {
      updateToolResult(id, result, is_error)
    },
    onDone: () => {
      finalizeStream()
    },
    onError: ({ message }) => {
      setError(message)
      finalizeStream()
    },
    onAuthError: () => {
      resetUser()
      router.push("/login")
    },
  })

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      // Store for retry
      lastMessageRef.current = content.trim()

      // Use store's conversationId (updated after first message) or the prop
      const currentConversationId = useConversationStore.getState().conversationId || conversationId

      // Add user message to store immediately for optimistic UI
      const userMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: currentConversationId ?? "",
        role: "user" as const,
        content: content.trim(),
        created_at: new Date().toISOString(),
      }
      addMessage(userMessage)

      // Force scroll to bottom
      setScrollTrigger((prev) => prev + 1)

      // Start streaming
      startStream()

      // Send to API - use currentConversationId to maintain session
      await sendMessage(content.trim(), {
        conversationId: currentConversationId,
      })
    },
    [conversationId, isStreaming, addMessage, startStream, sendMessage]
  )

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSendMessage(suggestion)
    },
    [handleSendMessage]
  )

  // Handle event selection - auto-send follow-up message
  const handleSelectEvent = useCallback(
    (event: typeof selectedEvent) => {
      if (event && event.name && event.date) {
        // Store already updated by EventResultsGrid, but we send the auto-message
        const message = `I'd like to go to ${event.name} on ${event.date}${event.venue ? ` at ${event.venue}` : ''}${event.city ? ` in ${event.city}` : ''}`
        handleSendMessage(message)
      }
    },
    [handleSendMessage]
  )

  // Handle flight selection
  const handleSelectFlight = useCallback(
    (flight: typeof selectedFlight) => {
      if (flight) {
        selectFlight(flight)
      }
    },
    [selectFlight]
  )

  // Handle stopping the stream
  const handleStop = useCallback(() => {
    abort()
    finalizeStream()
  }, [abort, finalizeStream])

  // Handle retry after error
  const handleRetry = useCallback(() => {
    if (lastMessageRef.current) {
      setError(null)
      handleSendMessage(lastMessageRef.current)
    }
  }, [setError, handleSendMessage])

  // Show loading state while fetching conversation
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <MessageListSkeleton count={4} />
        </div>
        <div className="border-t bg-background px-3 py-3 sm:p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={() => {}} onStop={() => {}} isStreaming={false} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Debug Panel - Toggle with keyboard shortcut or button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-20 right-4 z-50 p-2 rounded-full bg-muted hover:bg-muted/80 opacity-50 hover:opacity-100 transition-opacity"
        title="Toggle debug panel"
      >
        <Bug className="w-4 h-4" />
      </button>
      {showDebug && (
        <div className="fixed bottom-32 right-4 z-50 p-3 rounded-lg bg-black/90 text-white text-xs font-mono max-w-sm">
          <div className="space-y-1">
            <div>prop conversationId: {conversationId || "(none)"}</div>
            <div>store conversationId: {storeConversationId || "(none)"}</div>
            <div>messages: {messages.length}</div>
            <div>isStreaming: {isStreaming ? "true" : "false"}</div>
            <div>streamingContent: {streamingContent.length} chars</div>
            <div>toolCalls: {pendingToolCalls.length}</div>
            <div className="pt-1 border-t border-white/20 mt-1">
              {messages.map((m, i) => (
                <div key={m.id} className="truncate">
                  {i + 1}. {m.role}: {m.content?.slice(0, 30) || "(tool)"}...
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        pendingToolCalls={pendingToolCalls}
        selectedEvent={selectedEvent}
        selectedFlight={selectedFlight}
        onSelectEvent={handleSelectEvent}
        onSelectFlight={handleSelectFlight}
        onSuggestionClick={handleSuggestionClick}
        scrollTrigger={scrollTrigger}
        className="flex-1"
      />

      {/* Error display */}
      {storeError && (
        <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm text-center flex items-center justify-center gap-3">
          <span>{storeError}</span>
          {lastMessageRef.current && (
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-destructive/20 hover:bg-destructive/30 rounded-md transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setError(null)}
            className="underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-background px-3 py-3 sm:p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStop}
            isStreaming={isStreaming}
            autoFocus
            initialValue={initialPrompt}
          />
        </div>
      </div>
    </div>
  )
}
