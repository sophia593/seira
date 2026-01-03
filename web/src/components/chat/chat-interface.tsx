"use client"

import { useCallback, useEffect, useState } from "react"
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
} from "@/stores/conversation-store"
import { MessageList } from "./message-list"
import { ChatInput } from "./chat-input"
import { Loader2 } from "lucide-react"

interface ChatInterfaceProps {
  conversationId?: string
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [scrollTrigger, setScrollTrigger] = useState(0)

  // Store state
  const messages = useConversationStore(selectMessages)
  const isStreaming = useConversationStore(selectIsStreaming)
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
    selectEvent,
    selectFlight,
    setError,
    reset,
  } = useConversationStore()

  // Load conversation history when conversationId changes
  useEffect(() => {
    reset()
    setConversationId(conversationId ?? null)

    if (!conversationId) {
      return
    }

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
  }, [conversationId, reset, setConversationId, setConversation, setMessages, setError])

  // Streaming hook with callbacks
  const { sendMessage, abort } = useStreaming({
    onStart: ({ conversation_id }) => {
      if (!conversationId && conversation_id) {
        setConversationId(conversation_id)
        window.history.replaceState(null, "", `/chat/${conversation_id}`)
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
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center">
          {storeError}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline"
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
