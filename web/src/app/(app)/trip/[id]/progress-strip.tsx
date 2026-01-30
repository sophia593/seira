'use client'

import { Check, Circle, ArrowRight, ChevronRight } from 'lucide-react'
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
// Helpers
// =============================================================================

function getNextAction(statuses: TripComponentStatuses): string {
  if (!statuses.event.resolved) return 'select an event to get started'
  if (!statuses.flights.resolved) return 'add flights or skip if you don\'t need them'
  if (!statuses.hotel.resolved) return 'add a hotel or skip if you don\'t need one'
  return 'ready to review your trip'
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

  const components = [
    { key: 'event', label: 'Event', status: event },
    { key: 'flights', label: 'Flights', status: flights },
    { key: 'hotel', label: 'Hotel', status: hotel },
  ]

  const resolvedCount = components.filter((c) => c.status.resolved).length
  const isReady = resolvedCount === components.length
  const nextAction = getNextAction(statuses)

  return (
    <div
      className={cn(
        'p-3 sm:p-4 rounded-lg sm:rounded-xl border bg-card',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Status indicators with arrows */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          {components.map((component, index) => (
            <div key={component.key} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <StatusIndicator
                label={component.label}
                resolved={component.status.resolved}
                skipped={component.status.skipped}
              />
            </div>
          ))}
        </div>

        {/* Review button */}
        <Button
          onClick={onReviewClick}
          disabled={!isReady}
          size="sm"
          className={cn(
            'gap-2 transition-all w-full sm:w-auto shrink-0',
            isReady
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'opacity-50'
          )}
        >
          Review & Book
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Next action nudge */}
      <p className={cn(
        'text-xs mt-2.5 pt-2.5 border-t',
        isReady ? 'text-green-600 dark:text-green-500 font-medium' : 'text-muted-foreground'
      )}>
        {isReady ? '✓ ' : 'next: '}{nextAction}
      </p>
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
    <div className="flex items-center gap-1.5 shrink-0">
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
