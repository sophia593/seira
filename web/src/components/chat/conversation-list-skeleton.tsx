'use client'

import { cn } from '@/lib/utils'

// =============================================================================
// Skeleton Base
// =============================================================================

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-muted/60 rounded animate-pulse',
        className
      )}
      style={style}
    />
  )
}

// =============================================================================
// Conversation Item Skeleton
// =============================================================================

interface ConversationItemSkeletonProps {
  className?: string
}

function ConversationItemSkeleton({ className }: ConversationItemSkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center px-3 py-2.5 rounded-lg',
        className
      )}
    >
      {/* Title line — random width for natural look */}
      <Skeleton className="h-4 w-[70%]" />
    </div>
  )
}

// =============================================================================
// Conversation List Skeleton
// =============================================================================

interface ConversationListSkeletonProps {
  count?: number
  className?: string
}

function ConversationListSkeleton({
  count = 5,
  className,
}: ConversationListSkeletonProps) {
  // Vary widths for more natural appearance
  const widths = ['w-[85%]', 'w-[60%]', 'w-[75%]', 'w-[50%]', 'w-[70%]', 'w-[65%]', 'w-[80%]']

  return (
    <div className={cn('space-y-1', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center px-3 py-2.5 rounded-lg"
        >
          <Skeleton
            className={cn('h-4', widths[i % widths.length])}
            style={{ animationDelay: `${i * 100}ms` }}
          />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Exports
// =============================================================================

export {
  Skeleton,
  ConversationItemSkeleton,
  ConversationListSkeleton,
}
