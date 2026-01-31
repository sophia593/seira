'use client'

import { Calendar, MapPin, Ticket } from 'lucide-react'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { cn } from '@/lib/utils'
import type { EventResult } from '@/hooks/use-event-search'

// =============================================================================
// Types
// =============================================================================

interface EventCardProps {
  event: EventResult
  onSelect?: (event: EventResult) => void
  selected?: boolean
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function EventCard({
  event,
  onSelect,
  selected = false,
  className,
}: EventCardProps) {
  const { name, date, time, venue, price_range, image_url, showtimes } = event

  const formattedDate = formatDate(date)
  const formattedTime = time ? formatTime(time) : null
  const venueDisplay = venue ? [venue.name, venue.city].filter(Boolean).join(', ') : null
  const priceDisplay = price_range?.min ? `$${Math.round(price_range.min)}+` : null
  const showtimeCount = showtimes?.length ?? 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(event)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(event)
        }
      }}
      className={cn(
        'group relative rounded-xl border bg-card overflow-hidden transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:border-primary/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'ring-2 ring-primary border-primary',
        className
      )}
    >
      {/* Image */}
      {image_url ? (
        <div className="aspect-[4/3] sm:aspect-[16/9] overflow-hidden bg-muted relative">
          <OptimizedImage
            src={image_url}
            alt={name}
            fill
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] sm:aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Event Name */}
        <h3 className="font-semibold text-base leading-tight mb-2 line-clamp-2 lowercase">
          {name}
        </h3>

        {/* Details */}
        <div className="space-y-1.5">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            {showtimeCount > 1 ? (
              <span>{showtimeCount} upcoming dates</span>
            ) : (
              <span>
                {formattedDate}
                {formattedTime && <span className="ml-1">· {formattedTime}</span>}
              </span>
            )}
          </div>

          {/* Venue */}
          {venueDisplay && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{venueDisplay}</span>
            </div>
          )}

          {/* Price */}
          {priceDisplay && (
            <div className="flex items-center gap-2 text-sm">
              <Ticket className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="font-medium text-foreground">{priceDisplay}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          selected
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
