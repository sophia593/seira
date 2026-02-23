// components/ui/badges.tsx
// Specialized badges that use constants for consistent styling
// Accessible, screen-reader-friendly with proper ARIA attributes

import { cn } from '@/lib/utils'
import {
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  EVENT_STATUS_CONFIG,
  TALENT_TYPE_CONFIG,
} from '@/lib/constants'
import type {
  DeliverableCategory,
  DeliverableStatus,
  EventStatus,
  TalentType,
} from '@/lib/types/database'

// =============================================================================
// Category Badge
// =============================================================================

interface CategoryBadgeProps {
  category: DeliverableCategory
  talentSubType?: TalentType | null
  showIcon?: boolean
  className?: string
}

export function CategoryBadge({
  category,
  talentSubType,
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category]
  const subConfig = category === 'talent' && talentSubType ? TALENT_TYPE_CONFIG[talentSubType] : null

  const ariaLabel = subConfig
    ? `Category: ${config.label}, ${subConfig.label}`
    : `Category: ${config.label}`

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
        'transition-colors duration-150',
        config.bgColor,
        config.color,
        config.borderColor,
        className,
      )}
    >
      {showIcon && <span aria-hidden="true">{config.icon}</span>}
      <span>{config.label}</span>
      {subConfig && (
        <>
          <span aria-hidden="true" className="mx-0.5 text-current/30">|</span>
          <span aria-hidden="true">{subConfig.icon}</span>
          <span>{subConfig.label}</span>
        </>
      )}
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
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
        'transition-colors duration-150',
        config.bgColor,
        config.color,
        config.borderColor,
        className,
      )}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn(
            'h-2 w-2 rounded-full ring-1 ring-white/50',
            config.dotColor,
          )}
        />
      )}
      {showIcon && <span aria-hidden="true">{config.icon}</span>}
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
      role="status"
      aria-label={`Event status: ${config.label}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
        'transition-colors duration-150',
        config.bgColor,
        config.color,
        config.borderColor,
        className,
      )}
    >
      {showIcon && <span aria-hidden="true">{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}
