'use client'

import { useRef, useEffect, useCallback } from 'react'

// =============================================================================
// useAutoScroll Hook
// =============================================================================

interface UseAutoScrollOptions {
  /** Pixels from bottom to maintain auto-scroll (default: 150) */
  threshold?: number
  /** Use instant scroll while streaming (less jitter) */
  isStreaming?: boolean
}

/**
 * Smart auto-scroll that respects user scroll position.
 * Only auto-scrolls when user is near the bottom.
 *
 * Usage:
 *   const { containerRef, scrollToBottom, forceScrollToBottom } = useAutoScroll({
 *     isStreaming,
 *   })
 *
 *   useEffect(() => {
 *     scrollToBottom()
 *   }, [messages, streamingContent, scrollToBottom])
 *
 *   // When user sends a message:
 *   forceScrollToBottom()
 *
 *   return <div ref={containerRef} className="overflow-y-auto">...</div>
 */
export function useAutoScroll({
  threshold = 150,
  isStreaming = false,
}: UseAutoScrollOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const lastScrollTop = useRef(0)

  // Track scroll position to detect user scrolling up
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      // User scrolled up → disable auto-scroll
      if (scrollTop < lastScrollTop.current && distanceFromBottom > threshold) {
        shouldAutoScroll.current = false
      }
      // User scrolled to bottom → re-enable
      else if (distanceFromBottom <= threshold) {
        shouldAutoScroll.current = true
      }

      lastScrollTop.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [threshold])

  // Smooth scroll (respects shouldAutoScroll)
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container || !shouldAutoScroll.current) return

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: isStreaming ? 'instant' : 'smooth',
      })
    })
  }, [isStreaming])

  // Force scroll (ignores shouldAutoScroll - use when user sends message)
  const forceScrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    shouldAutoScroll.current = true
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'instant',
      })
    })
  }, [])

  return {
    containerRef,
    scrollToBottom,
    forceScrollToBottom,
  }
}

// =============================================================================
// Message Spacing Utility
// =============================================================================

type MessageRole = 'user' | 'assistant' | 'tool' | 'system'

/**
 * Get consistent spacing class based on message sequence.
 *
 * Usage:
 *   {messages.map((msg, i) => (
 *     <div key={msg.id} className={getMessageSpacing(msg.role, messages[i-1]?.role)}>
 *       <Message ... />
 *     </div>
 *   ))}
 */
export function getMessageSpacing(
  currentRole: MessageRole,
  previousRole?: MessageRole
): string {
  // First message - no top margin
  if (!previousRole) return ''

  // Same sender - tighter spacing
  if (currentRole === previousRole) {
    return 'mt-1.5' // 6px
  }

  // Different sender - more breathing room
  return 'mt-4' // 16px
}

// =============================================================================
// Constants (if you prefer explicit values)
// =============================================================================

export const MESSAGE_SPACING = {
  none: '',
  sameSender: 'mt-1.5',
  differentSender: 'mt-4',
  streaming: 'mt-3',
} as const
