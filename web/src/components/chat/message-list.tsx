"use client"

import { useEffect, useRef, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageItem } from "./message-item"
import { StreamingMessage } from "./streaming-message"
import { cn } from "@/lib/utils"
import {
  useConversationStore,
  selectStreamingMessage,
  selectIsStreaming,
} from "@/stores/conversation-store"

interface Message {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  tool_calls?: unknown[]
  created_at: string
}

interface MessageListProps {
  messages: Message[]
  isStreaming?: boolean
  className?: string
}

export function MessageList({
  messages,
  isStreaming: isStreamingProp = false,
  className,
}: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef(messages.length)

  // Get streaming state directly from store
  const streamingMessage = useConversationStore(selectStreamingMessage)
  const isStreaming = useConversationStore(selectIsStreaming) || isStreamingProp

  // Check if user is near the bottom of the scroll area
  const isNearBottom = useCallback((): boolean => {
    const viewport = viewportRef.current
    if (!viewport) return true

    const threshold = 100
    const { scrollTop, scrollHeight, clientHeight } = viewport
    return scrollTop + clientHeight >= scrollHeight - threshold
  }, [])

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    scrollAnchorRef.current?.scrollIntoView({ behavior, block: "end" })
  }, [])

  // Auto-scroll when messages change or streaming content updates
  useEffect(() => {
    const messagesLengthChanged = messages.length !== prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    // Only auto-scroll if user is near the bottom
    if (isNearBottom()) {
      // Use instant scroll for initial load or new messages, smooth for streaming
      const behavior = messagesLengthChanged ? "instant" : "smooth"
      scrollToBottom(behavior as ScrollBehavior)
    }
  }, [messages.length, isStreaming, streamingMessage?.content, isNearBottom, scrollToBottom])

  // Empty state
  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full",
          className
        )}
      >
        <p className="text-muted-foreground text-sm">Start a conversation</p>
      </div>
    )
  }

  // Filter out the synthetic streaming message if present (we render it separately)
  const displayMessages = messages.filter((m) => m.id !== "streaming")

  return (
    <ScrollArea
      viewportRef={viewportRef}
      className={cn("h-full", className)}
    >
      <div className="py-4 space-y-4">
        {displayMessages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLast={!isStreaming && index === displayMessages.length - 1}
          />
        ))}

        {/* Streaming message with live updates */}
        {isStreaming && streamingMessage && (
          <StreamingMessage
            content={streamingMessage.content}
            toolCalls={streamingMessage.toolCalls}
          />
        )}

        {/* Scroll anchor */}
        <div ref={scrollAnchorRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  )
}
