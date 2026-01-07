'use client'

import { memo } from 'react'
import { Check, Calendar, MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Event } from '@/types/event'

// =============================================================================
// Types
// =============================================================================

interface EventCardProps {
  event: Event
  index?: number
  isSelected?: boolean
  onSelect?: (event: Event) => void
}

// =============================================================================
// Main Component
// =============================================================================

export const EventCard = memo(function EventCard({
  event,
  index,
  isSelected = false,
  onSelect,
}: EventCardProps) {
  const {
    name,
    date,
    time,
    venue_name,
    venue_city,
    venue_state,
    image_url,
    price_min,
    purchase_url,
  } = event

  // Format date: "sat, mar 15"
  const formattedDate = formatEventDate(date)

  // Format time: "8:00 pm"
  const formattedTime = time ? formatEventTime(time) : null

  // Format location: "moody center · austin, tx"
  const location = formatLocation(venue_name, venue_city, venue_state)

  // Format price: "from $85"
  const priceDisplay = price_min ? `from $${price_min}` : null

  const handleCardClick = () => {
    onSelect?.(event)
  }

  const handleTicketsClick = (e: React.MouseEvent) => {
    // Prevent card selection when clicking the tickets link
    e.stopPropagation()
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'relative flex flex-col rounded-xl border bg-card overflow-hidden',
        'cursor-pointer transition-colors duration-150',
        'hover:border-border hover:shadow-sm',
        // Selected state
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border/50'
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
    >
      {/* Number badge */}
      {typeof index === 'number' && (
        <div className="absolute top-2 left-2 z-10">
          <div className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{index + 1}</span>
          </div>
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
      )}

      {/* Image */}
      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <EventImagePlaceholder />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        {/* Event name */}
        <h3 className="font-medium lowercase line-clamp-2 mb-2">{name}</h3>

        {/* Date & time */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {formattedDate}
            {formattedTime && ` · ${formattedTime}`}
          </span>
        </div>

        {/* Venue & location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="lowercase truncate">{location}</span>
        </div>

        {/* Price & tickets link */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          {priceDisplay ? (
            <span className="text-sm font-medium">{priceDisplay}</span>
          ) : (
            <span className="text-sm text-muted-foreground">price varies</span>
          )}

          <a
            href={purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleTicketsClick}
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium lowercase',
              'text-primary hover:text-primary/80 transition-colors'
            )}
          >
            view tickets
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
})

// =============================================================================
// Subcomponents
// =============================================================================

/**
 * Placeholder for missing event images
 */
function EventImagePlaceholder() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
      <Calendar className="w-8 h-8 text-muted-foreground/50" />
    </div>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format date: "2025-03-15" → "sat, mar 15"
 */
function formatEventDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toLowerCase()
}

/**
 * Format time: "20:00" → "8:00 pm"
 * Handles various input formats gracefully
 */
function formatEventTime(timeString: string): string | null {
  if (!timeString) return null

  // If already contains am/pm, just lowercase it
  if (/am|pm/i.test(timeString)) {
    return timeString.toLowerCase()
  }

  // Try to parse HH:MM format
  const parts = timeString.split(':')
  if (parts.length < 2) return null

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)

  if (isNaN(hours) || isNaN(minutes)) return null

  const date = new Date()
  date.setHours(hours, minutes)
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
}

/**
 * Format location: "moody center · austin, tx"
 */
function formatLocation(
  venue: string,
  city: string,
  state?: string | null
): string {
  const cityState = state ? `${city}, ${state}` : city
  return `${venue} · ${cityState}`
}
