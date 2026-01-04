"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useStreaming } from "@/hooks/use-streaming"
import { getApi } from "@/lib/api"
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
import { ChatInput } from "./chat-input"
import { Loader2, Bug } from "lucide-react"

interface ChatInterfaceProps {
  conversationId?: string
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
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

  // Track if this is the initial mount
  const hasInitialized = useRef(false)
  const previousConversationId = useRef<string | undefined>(conversationId)

  // Load conversation history ONLY when navigating to an existing conversation
  useEffect(() => {
    // If no conversationId prop, this is a fresh /chat - do nothing
    if (!conversationId) {
      // Only reset on very first mount with no conversation
      if (!hasInitialized.current) {
        hasInitialized.current = true
        const state = useConversationStore.getState()
        // Only reset if store is completely empty
        if (!state.conversationId && state.messages.length === 0) {
          reset()
        }
      }
      return
    }

    // If conversationId matches what's in store, skip (we just created it)
    const storeState = useConversationStore.getState()
    if (conversationId === storeState.conversationId) {
      return
    }

    // If we're streaming, don't interrupt
    if (storeState.isStreaming) {
      return
    }

    // Only load if we're navigating to a DIFFERENT conversation
    if (previousConversationId.current !== conversationId) {
      previousConversationId.current = conversationId

      // Clear state for the new conversation
      loadExistingConversation(conversationId)

      let cancelled = false

      async function loadConversation() {
        setIsLoading(true)
        try {
          const api = getApi()
          const data = await api.getConversation(conversationId!)

          if (cancelled) return

          setConversation(data.conversation)
          setMessages(data.messages)
        } catch (err) {
          if (cancelled) return
          console.error("Failed to load conversation:", err)
          setError("Failed to load conversation")
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
    }
  }, [conversationId, setConversation, setMessages, setError])

  // Streaming hook with callbacks
  const { sendMessage, abort } = useStreaming({
    onStart: ({ conversation_id }) => {
      if (!conversationId && conversation_id) {
        setConversationId(conversation_id)
        // Don't update URL - it can cause issues. User can navigate to conversation later.
        // window.history.replaceState(null, "", `/chat/${conversation_id}`)
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
  })

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      // Store for retry
      lastMessageRef.current = content.trim()

      // Add user message to store immediately for optimistic UI
      const userMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId ?? "",
        role: "user" as const,
        content: content.trim(),
        created_at: new Date().toISOString(),
      }
      addMessage(userMessage)

      // Force scroll to bottom
      setScrollTrigger((prev) => prev + 1)

      // Start streaming
      startStream()

      // Send to API
      await sendMessage(content.trim(), {
        conversationId: conversationId,
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
      if (event) {
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
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading conversation...</p>
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
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStop}
            isStreaming={isStreaming}
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}
