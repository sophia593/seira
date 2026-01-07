'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { AvatarAssistant } from '@/components/ui/avatar'

// =============================================================================
// Types
// =============================================================================

interface TypingIndicatorProps {
  /** Delay before showing - prevents flash for fast responses (default: 400ms) */
  showDelay?: number
  /** Show avatar to match assistant message layout */
  showAvatar?: boolean
  className?: string
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Typing indicator shown while waiting for assistant response.
 *
 * Usage in message-list:
 *   {isStreaming && !streamingContent && pendingToolCalls.length === 0 && (
 *     <div className="mt-4">
 *       <TypingIndicator />
 *     </div>
 *   )}
 */
export function TypingIndicator({
  showDelay = 400,
  showAvatar = true,
  className,
}: TypingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), showDelay)
    return () => clearTimeout(timer)
  }, [showDelay])

  // Don't render anything until delay passes
  if (!isVisible) return null

  return (
    <div
      className={cn(
        'flex items-start gap-2 sm:gap-3',
        'animate-in fade-in-0 duration-200',
        className
      )}
    >
      {showAvatar && (
        <AvatarAssistant size="default" className="flex-shrink-0" />
      )}

      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md bg-muted">
        <BouncingDot delay={0} />
        <BouncingDot delay={150} />
        <BouncingDot delay={300} />
      </div>
    </div>
  )
}

function BouncingDot({ delay }: { delay: number }) {
  return (
    <span
      className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: '1s',
      }}
    />
  )
}

export default TypingIndicator
