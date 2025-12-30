'use client'

import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type TripEvent } from '@/types/event'

// =============================================================================
// Types
// =============================================================================

interface EventDetailCardProps {
  event: TripEvent
  className?: string
}

// =============================================================================
// Main Component
// =============================================================================

export function EventDetailCard({ event, className }: EventDetailCardProps) {
  const {
    name,
    date,
    time,
    venue_name,
    venue_city,
    venue_state,
    image_url,
    ticket_url,
    section,
    row,
    seats,
    price_per_ticket,
    quantity,
  } = event

  // Format date: "saturday, march 15, 2025"
  const formattedDate = formatFullDate(date)

  // Format time: "8:00 pm"
  const formattedTime = time ? formatTime(time) : null

  // Format location
  const location = venue_state ? `${venue_city}, ${venue_state}` : venue_city

  // Build ticket details string
  const ticketDetails = buildTicketDetails(section, row, seats)

  // Calculate total
  const totalPrice = price_per_ticket ? price_per_ticket * quantity : null

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-48 lg:w-64 flex-shrink-0">
          <div className="aspect-[4/3] md:aspect-auto md:h-full bg-muted relative">
            {image_url ? (
              <img
                src={image_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-5">
          {/* Event name */}
          <h3 className="text-lg font-semibold lowercase mb-3">{name}</h3>

          {/* Details */}
          <div className="space-y-2 mb-4">
            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>

            {/* Time */}
            {formattedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{formattedTime}</span>
              </div>
            )}

            {/* Venue */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="lowercase">
                {venue_name} · {location}
              </span>
            </div>
          </div>

          {/* Ticket info (if saved) */}
          {(ticketDetails || price_per_ticket) && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              {ticketDetails && <p className="text-sm mb-1">{ticketDetails}</p>}
              {price_per_ticket && (
                <p className="text-sm font-medium">
                  ${price_per_ticket} × {quantity} = ${totalPrice}
                </p>
              )}
            </div>
          )}

          {/* Action */}
          <Button asChild className="lowercase">
            <a href={ticket_url} target="_blank" rel="noopener noreferrer">
              view tickets
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format date: "2025-03-15" → "saturday, march 15, 2025"
 */
function formatFullDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format time: "20:00" → "8:00 pm"
 */
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
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
 * Build ticket details string: "Section 102 · Row G · Seats 5-6"
 */
function buildTicketDetails(
  section?: string | null,
  row?: string | null,
  seats?: string | null
): string | null {
  const parts: string[] = []

  if (section) parts.push(`Section ${section}`)
  if (row) parts.push(`Row ${row}`)
  if (seats) parts.push(`Seats ${seats}`)

  return parts.length > 0 ? parts.join(' · ') : null
}
