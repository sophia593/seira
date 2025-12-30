"use client"

import { useEffect, useRef, useState, useCallback, memo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserMessage } from "./user-message"
import { AssistantMessage } from "./assistant-message"
import { StreamingMessage } from "./streaming-message"
import { EmptyState } from "./empty-state"
import { ScrollToBottom } from "./scroll-to-bottom"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/api/client"
import type {
  ToolCall,
  SelectedEvent,
  SelectedFlight,
} from "@/stores/conversation-store"

interface MessageListProps {
  // Content
  messages: Message[]

  // Streaming state
  isStreaming: boolean
  streamingContent: string
  pendingToolCalls: ToolCall[]

  // Selections for tool results
  selectedEvent: SelectedEvent | null
  selectedFlight: SelectedFlight | null
  onSelectEvent?: (event: SelectedEvent) => void
  onSelectFlight?: (flight: SelectedFlight) => void

  // Empty state
  onSuggestionClick: (suggestion: string) => void

  // External scroll trigger (increment to force scroll to bottom)
  scrollTrigger?: number

  className?: string
}

// Threshold for "near bottom" detection (in pixels)
const SCROLL_THRESHOLD = 100

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const MessageList = memo(function MessageList({
  messages,
  isStreaming,
  streamingContent,
  pendingToolCalls,
  selectedEvent,
  selectedFlight,
  onSelectEvent,
  onSelectFlight,
  onSuggestionClick,
  scrollTrigger,
  className,
}: MessageListProps) {
  // Ref to the ScrollArea's viewport (the actual scrollable element)
  const viewportRef = useRef<HTMLDivElement>(null)

  // Ref to track if we should auto-scroll on content changes
  // Using ref because scroll events fire rapidly and we don't want re-renders
  const shouldAutoScrollRef = useRef(true)

  // State for showing/hiding the scroll-to-bottom button
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Ref to the bottom of the message list (for scrollIntoView)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Check if viewport is scrolled near the bottom
  const checkIfNearBottom = useCallback((): boolean => {
    const viewport = viewportRef.current
    if (!viewport) return true // Default to true if no viewport

    const { scrollTop, scrollHeight, clientHeight } = viewport
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    return distanceFromBottom < SCROLL_THRESHOLD
  }, [])

  // Scroll to the bottom of the list
  const scrollToBottom = useCallback((instant = false) => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: instant ? "instant" : "smooth",
    })

    // Resume auto-scrolling
    shouldAutoScrollRef.current = true
    setShowScrollButton(false)
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const isNearBottom = checkIfNearBottom()

    // Update auto-scroll ref
    shouldAutoScrollRef.current = isNearBottom

    // Update button visibility (only if changed to avoid re-renders)
    setShowScrollButton((prev) => {
      const shouldShow = !isNearBottom
      return prev !== shouldShow ? shouldShow : prev
    })
  }, [checkIfNearBottom])

  // Scroll to bottom on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(true) // instant scroll on mount
    }, 50)

    return () => clearTimeout(timer)
  }, [scrollToBottom])

  // Auto-scroll when content changes (messages, streaming)
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      // Use instant scroll during streaming for smoothness
      // Use smooth scroll for discrete updates (new message complete)
      scrollToBottom(isStreaming)
    }
  }, [messages, streamingContent, pendingToolCalls, isStreaming, scrollToBottom])

  // Handle external scroll trigger (e.g., when user sends a message)
  useEffect(() => {
    if (scrollTrigger !== undefined && scrollTrigger > 0) {
      // User initiated action, always scroll
      shouldAutoScrollRef.current = true
      scrollToBottom(true)
    }
  }, [scrollTrigger, scrollToBottom])

  // Attach scroll listener to viewport
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      viewport.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  // Determine what to show
  const isEmpty = messages.length === 0 && !isStreaming
  const hasContent = messages.length > 0 || isStreaming

  return (
    <div className={cn("relative flex-1 min-h-0", className)}>
      {/* Scrollable message area */}
      <ScrollArea className="h-full" viewportRef={viewportRef}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isEmpty ? (
            <EmptyState onSuggestionClick={onSuggestionClick} />
          ) : (
            <div className="space-y-6">
              {/* Rendered messages */}
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  selectedEvent={selectedEvent}
                  selectedFlight={selectedFlight}
                  onSelectEvent={onSelectEvent}
                  onSelectFlight={onSelectFlight}
                />
              ))}

              {/* Streaming message (while Claude is responding) */}
              {isStreaming && (
                <StreamingMessage
                  content={streamingContent}
                  pendingToolCalls={pendingToolCalls}
                />
              )}

              {/* Invisible anchor at the bottom */}
              <div ref={bottomRef} className="h-px" aria-hidden="true" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      <ScrollToBottom
        show={showScrollButton && hasContent && !isStreaming}
        onClick={() => scrollToBottom(false)}
      />
    </div>
  )
})

// -----------------------------------------------------------------------------
// Individual message item (memoized to prevent re-renders)
// -----------------------------------------------------------------------------

interface MessageItemProps {
  message: Message
  selectedEvent: SelectedEvent | null
  selectedFlight: SelectedFlight | null
  onSelectEvent?: (event: SelectedEvent) => void
  onSelectFlight?: (flight: SelectedFlight) => void
}

const MessageItem = memo(function MessageItem({
  message,
  selectedEvent,
  selectedFlight,
  onSelectEvent,
  onSelectFlight,
}: MessageItemProps) {
  // Don't render system or tool messages directly
  if (message.role === "system" || message.role === "tool") {
    return null
  }

  if (message.role === "user") {
    return <UserMessage content={message.content} />
  }

  // Cast tool_calls to the expected type for AssistantMessage
  const toolCalls = message.tool_calls as Array<{
    id: string
    name: string
    input?: Record<string, unknown>
    result?: Record<string, unknown>
    is_error?: boolean
  }> | undefined

  // Assistant message
  return (
    <AssistantMessage
      content={message.content}
      toolCalls={toolCalls}
      selectedEvent={selectedEvent}
      selectedFlight={selectedFlight}
      onSelectEvent={onSelectEvent}
      onSelectFlight={onSelectFlight}
    />
  )
})
