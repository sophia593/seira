// components/ui/badges.tsx
// Specialized badges that use constants for consistent styling

import { cn } from '@/lib/utils'
import {
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  EVENT_STATUS_CONFIG,
} from '@/lib/constants'
import type {
  DeliverableCategory,
  DeliverableStatus,
  EventStatus,
} from '@/lib/types/database'

// =============================================================================
// Category Badge
// =============================================================================

interface CategoryBadgeProps {
  category: DeliverableCategory
  showIcon?: boolean
  className?: string
}

export function CategoryBadge({
  category,
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}

// =============================================================================
// Deliverable Status Badge
// =============================================================================

interface StatusBadgeProps {
  status: DeliverableStatus
  showIcon?: boolean
  showDot?: boolean
  className?: string
}

export function StatusBadge({
  status,
  showIcon = false,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
      )}
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}

// =============================================================================
// Event Status Badge
// =============================================================================

interface EventStatusBadgeProps {
  status: EventStatus
  showIcon?: boolean
  className?: string
}

export function EventStatusBadge({
  status,
  showIcon = true,
  className,
}: EventStatusBadgeProps) {
  const config = EVENT_STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}
