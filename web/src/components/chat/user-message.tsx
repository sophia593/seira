'use client'

import { memo, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface UserMessageProps {
  content: string
  className?: string
  /** Enable fade-in animation */
  animate?: boolean
}

// =============================================================================
// Main Component
// =============================================================================

export const UserMessage = memo(function UserMessage({
  content,
  className,
  animate = true,
}: UserMessageProps) {
  const [isVisible, setIsVisible] = useState(!animate)

  useEffect(() => {
    if (!animate) return
    // Immediate show for user messages (they typed it, no surprise)
    requestAnimationFrame(() => setIsVisible(true))
  }, [animate])

  return (
    <div
      className={cn(
        'flex justify-end',
        // Animation - faster for user messages
        'transition-all duration-200 ease-out',
        animate && (isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-1'),
        className
      )}
    >
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%]',
          'rounded-2xl rounded-br-md',
          'px-3 sm:px-4 py-2 sm:py-2.5',
          'bg-primary text-primary-foreground',
          'text-sm leading-relaxed',
          'break-words'
        )}
      >
        {content}
      </div>
    </div>
  )
})

export default UserMessage
