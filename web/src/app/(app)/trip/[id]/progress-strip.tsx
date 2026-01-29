'use client'

import { Check, Circle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export interface ComponentStatus {
  resolved: boolean
  skipped?: boolean
}

export interface TripComponentStatuses {
  event: ComponentStatus
  flights: ComponentStatus
  hotel: ComponentStatus
}

interface ProgressStripProps {
  statuses: TripComponentStatuses
  onReviewClick?: () => void
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function ProgressStrip({
  statuses,
  onReviewClick,
  className,
}: ProgressStripProps) {
  const { event, flights, hotel } = statuses

  // Calculate progress
  const components = [
    { key: 'event', label: 'Event', status: event },
    { key: 'flights', label: 'Flights', status: flights },
    { key: 'hotel', label: 'Hotel', status: hotel },
  ]

  const resolvedCount = components.filter((c) => c.status.resolved).length
  const totalCount = components.length
  const isReady = resolvedCount === totalCount

  // Status message
  const statusMessage = isReady
    ? 'Ready to review'
    : `${resolvedCount} of ${totalCount} decisions made`

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border bg-card',
        className
      )}
    >
      {/* Status indicators */}
      <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
        {components.map((component) => (
          <StatusIndicator
            key={component.key}
            label={component.label}
            resolved={component.status.resolved}
            skipped={component.status.skipped}
          />
        ))}

        {/* Divider */}
        <div className="hidden lg:block w-px h-5 bg-border" />

        {/* Status message */}
        <span
          className={cn(
            'hidden lg:block text-sm font-medium whitespace-nowrap',
            isReady ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'
          )}
        >
          {statusMessage}
        </span>
      </div>

      {/* Review button */}
      <Button
        onClick={onReviewClick}
        disabled={!isReady}
        size="sm"
        className={cn(
          'gap-2 transition-all w-full sm:w-auto',
          isReady
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'opacity-50'
        )}
      >
        Review & Book
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

// =============================================================================
// Status Indicator
// =============================================================================

interface StatusIndicatorProps {
  label: string
  resolved: boolean
  skipped?: boolean
}

function StatusIndicator({ label, resolved, skipped }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {resolved ? (
        <div
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center',
            skipped
              ? 'bg-muted text-muted-foreground'
              : 'bg-green-600 text-white'
          )}
        >
          <Check className="w-3 h-3" />
        </div>
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground/50" />
      )}
      <span
        className={cn(
          'text-sm',
          resolved ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
        {skipped && <span className="text-xs ml-1">(skipped)</span>}
      </span>
    </div>
  )
}
