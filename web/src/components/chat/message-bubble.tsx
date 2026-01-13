'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

// =============================================================================
// Types
// =============================================================================

type MessageRole = 'user' | 'assistant' | 'system'

interface MessageBubbleProps {
  role: MessageRole
  children: React.ReactNode
  className?: string
  isStreaming?: boolean
  timestamp?: string | Date
  showTimestamp?: boolean
}

// =============================================================================
// Style Config
// =============================================================================

const roleStyles: Record<MessageRole, string> = {
  user: 'bg-primary text-primary-foreground ml-auto',
  assistant: 'bg-muted/50 text-foreground',
  system: 'bg-muted/30 text-muted-foreground text-center mx-auto text-xs',
}

// =============================================================================
// Main Component
// =============================================================================

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble(
    {
      role,
      children,
      className,
      isStreaming = false,
      timestamp,
      showTimestamp = false,
    },
    ref
  ) {
    const formattedTime = timestamp
      ? new Date(timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).toLowerCase()
      : null

    return (
      <div
        ref={ref}
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3',
          roleStyles[role],
          isStreaming && 'animate-pulse',
          className
        )}
      >
        {/* Content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {children}
        </div>

        {/* Timestamp */}
        {showTimestamp && formattedTime && (
          <div
            className={cn(
              'text-[10px] mt-1.5 opacity-60',
              role === 'user' ? 'text-right' : 'text-left'
            )}
          >
            {formattedTime}
          </div>
        )}
      </div>
    )
  }
)

// =============================================================================
// User Message Shorthand
// =============================================================================

interface UserMessageProps {
  children: React.ReactNode
  className?: string
  timestamp?: string | Date
}

export function UserMessage({ children, className, timestamp }: UserMessageProps) {
  return (
    <MessageBubble role="user" className={className} timestamp={timestamp}>
      {children}
    </MessageBubble>
  )
}

// =============================================================================
// Assistant Message Shorthand
// =============================================================================

interface AssistantMessageProps {
  children: React.ReactNode
  className?: string
  isStreaming?: boolean
  timestamp?: string | Date
}

export function AssistantMessage({
  children,
  className,
  isStreaming,
  timestamp,
}: AssistantMessageProps) {
  return (
    <MessageBubble
      role="assistant"
      className={className}
      isStreaming={isStreaming}
      timestamp={timestamp}
    >
      {children}
    </MessageBubble>
  )
}

// =============================================================================
// System Message Shorthand
// =============================================================================

interface SystemMessageProps {
  children: React.ReactNode
  className?: string
}

export function SystemMessage({ children, className }: SystemMessageProps) {
  return (
    <MessageBubble role="system" className={className}>
      {children}
    </MessageBubble>
  )
}
