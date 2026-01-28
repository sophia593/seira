'use client'

import { Calendar, Clock, MapPin, ExternalLink, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export interface EventData {
  name: string
  date: string | null
  time: string | null
  venue: string | null
  city: string | null
  ticketUrl: string | null
  imageUrl?: string | null
}

interface EventAnchorProps {
  event: EventData
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function EventAnchor({ event, className }: EventAnchorProps) {
  const { name, date, time, venue, city, ticketUrl, imageUrl } = event

  const formattedDate = date ? formatDate(date) : null
  const formattedTime = time ? formatTime(time) : null
  const locationParts = [venue, city].filter(Boolean)

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-card overflow-hidden',
        'shadow-lg shadow-primary/5',
        className
      )}
    >
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary" />

      <div className="flex">
        {/* Image (if available) */}
        {imageUrl && (
          <div className="hidden sm:block w-32 md:w-40 shrink-0">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-5">
          {/* Event badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Ticket className="w-3 h-3" />
            YOUR EVENT
          </div>

          {/* Event name */}
          <h2 className="text-xl md:text-2xl font-bold tracking-tight lowercase leading-tight mb-3">
            {name}
          </h2>

          {/* Date & Time - prominent */}
          {(formattedDate || formattedTime) && (
            <div className="flex items-center gap-3 mb-2">
              {formattedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{formattedDate}</span>
                </div>
              )}
              {formattedTime && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formattedTime}</span>
                </div>
              )}
            </div>
          )}

          {/* Venue */}
          {locationParts.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>
                {venue && <span className="font-medium text-foreground">{venue}</span>}
                {venue && city && <span className="mx-1">·</span>}
                {city && <span>{city}</span>}
              </span>
            </div>
          )}

          {/* Ticket button */}
          {ticketUrl && (
            <Button asChild size="sm" className="gap-2">
              <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
                <Ticket className="w-4 h-4" />
                View Tickets
                <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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
