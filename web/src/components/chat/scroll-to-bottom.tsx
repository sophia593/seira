'use client'

import { memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrollToBottomProps {
  show: boolean
  onClick: () => void
  className?: string
}

export const ScrollToBottom = memo(function ScrollToBottom({
  show,
  onClick,
  className,
}: ScrollToBottomProps) {
  if (!show) return null

  return (
    <div
      className={cn(
        'absolute bottom-4 left-1/2 -translate-x-1/2 z-10',
        className
      )}
    >
      <button
        onClick={onClick}
        className="w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  )
})
