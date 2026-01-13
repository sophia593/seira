'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

// =============================================================================
// Types
// =============================================================================

type MessageRole = 'user' | 'assistant' | 'tool' | 'system'

interface Message {
  id: string
  role: MessageRole
  created_at?: string | Date
  content?: string
}

// =============================================================================
// useAutoScroll Hook — Butter Smooth Edition
// =============================================================================

interface UseAutoScrollOptions {
  /** Pixels from bottom to maintain auto-scroll (default: 150) */
  threshold?: number
  /** Use instant scroll while streaming (reduces jitter) */
  isStreaming?: boolean
  /** Debounce delay for scroll events in ms (default: 16 ~60fps) */
  debounceMs?: number
}

/**
 * Butter-smooth auto-scroll that respects user scroll position.
 * Optimized for streaming content with minimal jitter.
 *
 * Features:
 * - Debounced scroll detection
 * - RAF-batched scrolling
 * - Streaming-optimized (instant scroll during stream)
 * - Smart re-enable when user scrolls back to bottom
 */
export function useAutoScroll({
  threshold = 150,
  isStreaming = false,
  debounceMs = 16,
}: UseAutoScrollOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const lastScrollTop = useRef(0)
  const rafId = useRef<number | null>(null)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const isScrolling = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [])

  // Debounced scroll handler
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }

      // Debounce the scroll calculation
      scrollTimeout.current = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight

        // User scrolled up → disable auto-scroll
        if (scrollTop < lastScrollTop.current - 5 && distanceFromBottom > threshold) {
          shouldAutoScroll.current = false
        }
        // User scrolled to bottom → re-enable
        else if (distanceFromBottom <= threshold) {
          shouldAutoScroll.current = true
        }

        lastScrollTop.current = scrollTop
        isScrolling.current = false
      }, debounceMs)

      isScrolling.current = true
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [threshold, debounceMs])

  // Smooth scroll to bottom (respects shouldAutoScroll)
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container || !shouldAutoScroll.current) return

    // Cancel any pending RAF
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
    }

    // Batch scroll in next frame for smoothness
    rafId.current = requestAnimationFrame(() => {
      // Double RAF for extra smoothness (allows layout to settle)
      rafId.current = requestAnimationFrame(() => {
        const { scrollHeight, clientHeight } = container
        const targetScroll = scrollHeight - clientHeight

        // Skip if already at bottom
        if (Math.abs(container.scrollTop - targetScroll) < 1) return

        container.scrollTo({
          top: targetScroll,
          behavior: isStreaming ? 'instant' : 'smooth',
        })
      })
    })
  }, [isStreaming])

  // Force scroll (ignores shouldAutoScroll — use when user sends message)
  const forceScrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    shouldAutoScroll.current = true

    // Cancel any pending RAF
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
    }

    rafId.current = requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'instant',
      })
    })
  }, [])

  // Check if user is near bottom
  const isNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight <= threshold
  }, [threshold])

  return {
    containerRef,
    scrollToBottom,
    forceScrollToBottom,
    isNearBottom,
    shouldAutoScroll: () => shouldAutoScroll.current,
  }
}

// =============================================================================
// Message Spacing with Timestamp Awareness
// =============================================================================

interface SpacingOptions {
  /** Minutes gap to trigger larger spacing (default: 5) */
  timeGapMinutes?: number
}

/**
 * Get spacing class based on message sequence and time gaps.
 *
 * - Same sender, quick succession: tight (mt-1)
 * - Same sender, time gap: medium (mt-3)
 * - Different sender: comfortable (mt-4)
 * - Large time gap (>5 min): extra space (mt-6)
 */
export function getMessageSpacing(
  current: Message,
  previous?: Message,
  options: SpacingOptions = {}
): string {
  const { timeGapMinutes = 5 } = options

  // First message
  if (!previous) return ''

  // Calculate time gap
  const currentTime = current.created_at ? new Date(current.created_at).getTime() : Date.now()
  const previousTime = previous.created_at ? new Date(previous.created_at).getTime() : Date.now()
  const gapMs = currentTime - previousTime
  const gapMinutes = gapMs / (1000 * 60)

  // Large time gap — add extra breathing room
  if (gapMinutes >= timeGapMinutes) {
    return 'mt-6'
  }

  // Tool results — tight spacing
  if (current.role === 'tool') {
    return 'mt-2'
  }

  // System messages — more space
  if (current.role === 'system') {
    return 'mt-6'
  }

  // Same sender
  if (current.role === previous.role) {
    // Quick succession (<1 min)
    if (gapMinutes < 1) {
      return 'mt-1'
    }
    // Slight gap (1-5 min)
    return 'mt-3'
  }

  // Different sender
  return 'mt-4'
}

// =============================================================================
// Timestamp Formatting
// =============================================================================

/**
 * Format timestamp for display between message groups.
 * Returns null if timestamp shouldn't be shown.
 */
export function shouldShowTimestamp(
  current: Message,
  previous?: Message,
  gapMinutes: number = 5
): boolean {
  if (!previous) return false

  const currentTime = current.created_at ? new Date(current.created_at).getTime() : Date.now()
  const previousTime = previous.created_at ? new Date(previous.created_at).getTime() : Date.now()
  const gap = (currentTime - previousTime) / (1000 * 60)

  return gap >= gapMinutes
}

/**
 * Format a timestamp for display.
 */
export function formatMessageTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString()

  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase()

  if (isToday) {
    return time
  }

  if (isYesterday) {
    return `yesterday, ${time}`
  }

  // Within last week — show day name
  const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (daysAgo < 7) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    return `${dayName}, ${time}`
  }

  // Older — show full date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase()
}

// =============================================================================
// Typing Indicator Hook
// =============================================================================

interface UseTypingIndicatorOptions {
  /** How long to show typing after last update (ms) */
  timeout?: number
}

/**
 * Hook for managing typing indicator state.
 *
 * Usage:
 *   const { isTyping, startTyping, stopTyping } = useTypingIndicator()
 *
 *   // When receiving streaming content:
 *   useEffect(() => {
 *     if (streamingContent) startTyping()
 *     else stopTyping()
 *   }, [streamingContent])
 *
 *   // In render:
 *   {isTyping && <TypingIndicator />}
 */
export function useTypingIndicator({ timeout = 1000 }: UseTypingIndicatorOptions = {}) {
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startTyping = useCallback(() => {
    setIsTyping(true)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Auto-stop after timeout (in case stopTyping isn't called)
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, timeout)
  }, [timeout])

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsTyping(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isTyping,
    startTyping,
    stopTyping,
  }
}

// =============================================================================
// Typing Dots Animation Component Helper
// =============================================================================

/**
 * CSS-in-JS keyframes for typing dots.
 * Use with a style tag or your CSS framework.
 */
export const typingDotsStyles = `
  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
  }

  .typing-dot {
    animation: typingBounce 1.4s ease-in-out infinite;
  }

  .typing-dot:nth-child(1) { animation-delay: 0ms; }
  .typing-dot:nth-child(2) { animation-delay: 200ms; }
  .typing-dot:nth-child(3) { animation-delay: 400ms; }
`

// =============================================================================
// Message Grouping Helper
// =============================================================================

interface MessageGroup {
  senderId: string
  senderRole: MessageRole
  messages: Message[]
  timestamp: Date
}

/**
 * Group consecutive messages from the same sender.
 * Useful for rendering message bubbles with shared avatar.
 */
export function groupMessages(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = []

  for (const message of messages) {
    const lastGroup = groups[groups.length - 1]

    // Start new group if different sender or large time gap
    const shouldStartNewGroup =
      !lastGroup ||
      lastGroup.senderRole !== message.role ||
      (message.created_at &&
        lastGroup.timestamp &&
        new Date(message.created_at).getTime() - lastGroup.timestamp.getTime() > 5 * 60 * 1000)

    if (shouldStartNewGroup) {
      groups.push({
        senderId: message.id,
        senderRole: message.role,
        messages: [message],
        timestamp: message.created_at ? new Date(message.created_at) : new Date(),
      })
    } else {
      lastGroup.messages.push(message)
    }
  }

  return groups
}

// =============================================================================
// Constants
// =============================================================================

export const MESSAGE_SPACING = {
  none: '',
  tight: 'mt-1',
  sameSender: 'mt-1',
  sameSenderGap: 'mt-3',
  differentSender: 'mt-4',
  timeGap: 'mt-6',
  system: 'mt-6',
  tool: 'mt-2',
} as const

export const SCROLL_THRESHOLDS = {
  default: 150,
  aggressive: 50,
  relaxed: 300,
} as const

export const TIME_GAPS = {
  tight: 1, // 1 minute
  normal: 5, // 5 minutes
  large: 30, // 30 minutes
} as const
