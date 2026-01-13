'use client'

import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface TypingIndicatorProps {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  label?: string // For screen readers
}

// =============================================================================
// Size Config
// =============================================================================

const sizeConfig = {
  sm: {
    dot: 'w-1.5 h-1.5',
    gap: 'gap-1',
    container: 'px-3 py-2',
  },
  default: {
    dot: 'w-2 h-2',
    gap: 'gap-1.5',
    container: 'px-4 py-3',
  },
  lg: {
    dot: 'w-2.5 h-2.5',
    gap: 'gap-2',
    container: 'px-5 py-4',
  },
}

// =============================================================================
// Main Component
// =============================================================================

export function TypingIndicator({
  className,
  size = 'default',
  label = 'seira is thinking',
}: TypingIndicatorProps) {
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-2xl bg-muted/50',
        config.container,
        config.gap,
        className
      )}
      role="status"
      aria-label={label}
    >
      <span
        className={cn(
          'rounded-full bg-muted-foreground/60 animate-bounce',
          config.dot
        )}
        style={{ animationDelay: '0ms', animationDuration: '1s' }}
      />
      <span
        className={cn(
          'rounded-full bg-muted-foreground/60 animate-bounce',
          config.dot
        )}
        style={{ animationDelay: '150ms', animationDuration: '1s' }}
      />
      <span
        className={cn(
          'rounded-full bg-muted-foreground/60 animate-bounce',
          config.dot
        )}
        style={{ animationDelay: '300ms', animationDuration: '1s' }}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

// =============================================================================
// Inline Variant (for inside message bubbles)
// =============================================================================

export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span
        className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '1s' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: '150ms', animationDuration: '1s' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: '300ms', animationDuration: '1s' }}
      />
    </span>
  )
}
