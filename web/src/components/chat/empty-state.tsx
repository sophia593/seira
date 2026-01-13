'use client'

import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface EmptyStateProps {
  className?: string
  title?: string
  subtitle?: string
  children?: React.ReactNode // For example prompts slot
}

// =============================================================================
// Main Component
// =============================================================================

export function EmptyState({
  className,
  title = 'what event are you planning for?',
  subtitle = 'tell me about a concert, game, or show — i\'ll help you find tickets, flights, and hotels.',
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4 py-12',
        className
      )}
    >
      {/* Logo */}
      <div className="mb-6">
        <Logo variant="icon" linkToHome={false} animated={false} />
      </div>

      {/* Title */}
      <h2 className="text-lg sm:text-xl font-medium mb-2 lowercase">
        {title}
      </h2>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        {subtitle}
      </p>

      {/* Children (example prompts slot) */}
      {children}
    </div>
  )
}
