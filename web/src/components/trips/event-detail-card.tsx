'use client'

import { Calendar, MapPin, Clock, ExternalLink, Ticket, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type TripEventData, isRichEvent } from '@/types/trip'

// =============================================================================
// Types
// =============================================================================

interface EventDetailCardProps {
  event: TripEventData
  className?: string
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Event detail card that works with both:
 * - Flat TripDetail event fields (current API)
 * - Rich TripEvent objects (future API)
 */
export function EventDetailCard({ event, className }: EventDetailCardProps) {
  // Normalize to common shape
  const normalized = normalizeEvent(event)

  if (!normalized.name) {
    return null
  }

  const { name, date, time, venue, location, imageUrl, purchaseUrl, ticketDetails, totalPrice } = normalized

  return (
    <div className={cn('rounded-2xl border bg-gradient-to-br from-card to-muted/30 overflow-hidden', className)}>
      {/* Optional image header */}
      {imageUrl && (
        <div className="aspect-[3/1] relative overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Event content */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Event Icon */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Ticket className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Event</p>
            <h2 className="text-xl sm:text-2xl font-semibold lowercase truncate">
              {name}
            </h2>
          </div>
        </div>

        {/* Event Info Grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* Date & Time */}
          {date && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
              <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{date}</p>
                {time && (
                  <p className="text-xs text-muted-foreground">{time}</p>
                )}
              </div>
            </div>
          )}

          {/* Venue */}
          {venue && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
              <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium lowercase truncate">{venue}</p>
                {location && (
                  <p className="text-xs text-muted-foreground truncate lowercase">
                    {location}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ticket details (if available) */}
        {ticketDetails && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm">{ticketDetails}</p>
            {totalPrice && (
              <p className="text-sm font-semibold mt-1">${totalPrice}</p>
            )}
          </div>
        )}

        {/* Price estimate (for flat data) */}
        {!ticketDetails && normalized.priceEstimate && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">tickets from</span>
            <span className="font-semibold text-lg">${normalized.priceEstimate}</span>
          </div>
        )}
      </div>

      {/* Buy Tickets CTA */}
      {purchaseUrl && (
        <div className="px-5 sm:px-6 py-4 bg-primary/5 border-t">
          <Button
            asChild
            size="lg"
            className="w-full lowercase font-medium group"
          >
            <a href={purchaseUrl} target="_blank" rel="noopener noreferrer">
              <Ticket className="w-5 h-5 mr-2" />
              buy tickets
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Normalization
// =============================================================================

interface NormalizedEvent {
  name: string
  date: string | null
  time: string | null
  venue: string | null
  location: string | null
  imageUrl: string | null
  purchaseUrl: string | null
  ticketDetails: string | null
  totalPrice: number | null
  priceEstimate: number | null
}

function normalizeEvent(event: TripEventData): NormalizedEvent {
  if (isRichEvent(event)) {
    // Rich format - use all the details
    const ticketDetails = buildTicketDetails(event.section, event.row, event.seats)
    const totalPrice = event.price_per_ticket ? event.price_per_ticket * event.quantity : null
    const location = event.venue_state ? `${event.venue_city}, ${event.venue_state}` : event.venue_city

    return {
      name: event.name,
      date: formatFullDate(event.date),
      time: event.time ? formatTime(event.time) : null,
      venue: event.venue_name,
      location,
      imageUrl: event.image_url || null,
      purchaseUrl: event.ticket_url,
      ticketDetails,
      totalPrice,
      priceEstimate: null,
    }
  }

  // Flat format - use what we have
  return {
    name: event.name,
    date: event.date ? formatFullDate(event.date) : null,
    time: event.time ? formatTime(event.time) : null,
    venue: event.venue || null,
    location: event.venue_address || null,
    imageUrl: null,
    purchaseUrl: event.purchase_url || null,
    ticketDetails: null,
    totalPrice: null,
    priceEstimate: event.price_estimate || null,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatFullDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toLowerCase()
}

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
