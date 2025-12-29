"use client"

import { useCallback, useEffect, useState } from "react"
import { useStreaming } from "@/hooks/use-streaming"
import { getApi } from "@/lib/api"
import {
  useConversationStore,
  selectDisplayMessages,
  selectIsStreaming,
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

  // Store state
  const messages = useConversationStore(selectDisplayMessages)
  const isStreaming = useConversationStore(selectIsStreaming)
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
    setError,
    reset,
  } = useConversationStore()

  // Load conversation history when conversationId changes
  useEffect(() => {
    // Reset store when conversation changes
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
      // Update conversation ID if this created a new conversation
      if (!conversationId && conversation_id) {
        setConversationId(conversation_id)
        // Update URL without navigation (optional)
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
      // Finalize without adding message (it's already in the stream)
      // The backend saves the message, we could refetch or just use streaming content
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

      // Start streaming
      startStream()

      // Send to API
      await sendMessage(content.trim(), {
        conversationId: conversationId,
      })
    },
    [conversationId, isStreaming, addMessage, startStream, sendMessage]
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
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 && !conversationId ? (
          <EmptyState />
        ) : (
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            className="h-full"
          />
        )}
      </div>

      {/* Error display */}
      {storeError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center">
          {storeError}
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStop}
            isStreaming={isStreaming}
            disabled={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
      <div className="text-4xl mb-4">&#9992;</div>
      <h2 className="text-xl font-semibold mb-2">Plan your next adventure</h2>
      <p className="text-muted-foreground max-w-md">
        Tell me about an event you want to attend, and I&apos;ll help you plan
        the perfect trip with flights and everything coordinated.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <SuggestionChip text="Find Lakers games in February" />
        <SuggestionChip text="Taylor Swift concerts near me" />
        <SuggestionChip text="Comedy shows in NYC this weekend" />
      </div>
    </div>
  )
}

function SuggestionChip({ text }: { text: string }) {
  const { addMessage, startStream, setConversationId } = useConversationStore()
  const { sendMessage } = useStreaming({
    onStart: ({ conversation_id }) => {
      if (conversation_id) {
        setConversationId(conversation_id)
        window.history.replaceState(null, "", `/chat/${conversation_id}`)
      }
    },
    onText: ({ text }) => useConversationStore.getState().appendDelta(text),
    onToolStart: ({ id, name }) =>
      useConversationStore.getState().addToolCall(id, name),
    onToolInput: ({ id, input }) =>
      useConversationStore.getState().updateToolInput(id, input),
    onToolResult: ({ id, result, is_error }) =>
      useConversationStore.getState().updateToolResult(id, result, is_error),
    onDone: () => useConversationStore.getState().finalizeStream(),
    onError: ({ message }) => {
      useConversationStore.getState().setError(message)
      useConversationStore.getState().finalizeStream()
    },
  })

  const handleClick = async () => {
    const userMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: "",
      role: "user" as const,
      content: text,
      created_at: new Date().toISOString(),
    }
    addMessage(userMessage)
    startStream()
    await sendMessage(text)
  }

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
    >
      {text}
    </button>
  )
}
