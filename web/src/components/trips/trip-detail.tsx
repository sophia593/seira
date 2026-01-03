'use client'

import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Plane,
  Building2,
  ExternalLink,
  MessageSquare,
  Ticket,
  ArrowRight,
  PlaneTakeoff,
  PlaneLanding,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type TripDetail } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface TripDetailProps {
  trip: TripDetail
  className?: string
}

// =============================================================================
// Status Styles
// =============================================================================

const STATUS_STYLES: Record<TripDetail['status'], { bg: string; text: string }> = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground' },
  quoted: { bg: 'bg-primary/10', text: 'text-primary' },
  booked: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
  completed: { bg: 'bg-muted', text: 'text-muted-foreground' },
  cancelled: { bg: 'bg-destructive/10', text: 'text-destructive' },
}

// =============================================================================
// Main Component
// =============================================================================

export function TripDetailComponent({ trip, className }: TripDetailProps) {
  const destination = [trip.destination_city, trip.destination_country]
    .filter(Boolean)
    .join(', ')

  const hasEvent = !!trip.event_name
  const hasFlight = !!trip.flight_origin
  const hasHotel = !!trip.hotel_name

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <TripHeader trip={trip} destination={destination} />

      {/* Event Section - Prominent */}
      {hasEvent && <EventSection trip={trip} />}

      {/* Travel Details Grid - Always show with placeholders */}
      <div className="grid gap-4 md:grid-cols-2">
        {hasFlight ? <FlightSection trip={trip} /> : <FlightPlaceholder />}
        {hasHotel ? <HotelSection trip={trip} /> : <HotelPlaceholder />}
      </div>

      {/* Notes */}
      {trip.notes && <NotesSection notes={trip.notes} />}

      {/* Continue in Chat */}
      {trip.conversation_id && (
        <Button asChild variant="outline" className="w-full lowercase">
          <Link href={`/chat/${trip.conversation_id}`}>
            <MessageSquare className="w-4 h-4 mr-2" />
            continue planning in chat
          </Link>
        </Button>
      )}
    </div>
  )
}

// =============================================================================
// Trip Header
// =============================================================================

function TripHeader({ trip, destination }: { trip: TripDetail; destination: string }) {
  const styles = STATUS_STYLES[trip.status]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight lowercase truncate">
            {trip.title || trip.event_name || 'untitled trip'}
          </h1>
          {destination && (
            <p className="text-muted-foreground mt-1 lowercase flex items-center gap-1.5">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {destination}
            </p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium lowercase flex-shrink-0',
            styles.bg,
            styles.text
          )}
        >
          {trip.status}
        </span>
      </div>

      {/* Price Summary */}
      {trip.estimated_total && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted to-muted/50 border">
          <div>
            <p className="text-sm text-muted-foreground lowercase">estimated total</p>
            <p className="text-2xl sm:text-3xl font-semibold">
              ${trip.estimated_total.toLocaleString()}
            </p>
          </div>
          {trip.status === 'quoted' && trip.quote_expires_at && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">quote expires</p>
              <p className="text-sm font-medium">{formatShortDate(trip.quote_expires_at)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Event Section - Hero Style
// =============================================================================

function EventSection({ trip }: { trip: TripDetail }) {
  const formattedDate = trip.event_date ? formatFullDate(trip.event_date) : null
  const formattedTime = trip.event_time ? formatTime(trip.event_time) : null

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 overflow-hidden">
      {/* Event Header */}
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
              {trip.event_name}
            </h2>
          </div>
        </div>

        {/* Event Info Grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* Date & Time */}
          {formattedDate && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
              <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{formattedDate}</p>
                {formattedTime && (
                  <p className="text-xs text-muted-foreground">{formattedTime}</p>
                )}
              </div>
            </div>
          )}

          {/* Venue */}
          {trip.event_venue && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
              <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium lowercase truncate">{trip.event_venue}</p>
                {trip.event_venue_address && (
                  <p className="text-xs text-muted-foreground truncate lowercase">
                    {trip.event_venue_address}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ticket Price */}
        {trip.event_price_estimate && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">tickets from</span>
            <span className="font-semibold text-lg">${trip.event_price_estimate}</span>
          </div>
        )}
      </div>

      {/* Buy Tickets CTA */}
      {trip.event_purchase_url && (
        <div className="px-5 sm:px-6 py-4 bg-primary/5 border-t">
          <Button
            asChild
            size="lg"
            className="w-full lowercase font-medium group"
          >
            <a href={trip.event_purchase_url} target="_blank" rel="noopener noreferrer">
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
// Flight Section
// =============================================================================

function FlightSection({ trip }: { trip: TripDetail }) {
  const outboundDate = trip.flight_outbound_date ? formatShortDate(trip.flight_outbound_date) : null
  const returnDate = trip.flight_return_date ? formatShortDate(trip.flight_return_date) : null

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Plane className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium lowercase">flights</h3>
          {trip.flight_carrier && (
            <p className="text-xs text-muted-foreground">{trip.flight_carrier}</p>
          )}
        </div>
      </div>

      {/* Flight Details */}
      <div className="space-y-3">
        {/* Outbound */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <PlaneTakeoff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{trip.flight_origin}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium">{trip.flight_destination}</span>
            </div>
            {outboundDate && (
              <p className="text-xs text-muted-foreground">
                {outboundDate}
                {trip.flight_outbound_time && ` · ${trip.flight_outbound_time}`}
              </p>
            )}
          </div>
        </div>

        {/* Return */}
        {trip.flight_return_date && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <PlaneLanding className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{trip.flight_destination}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium">{trip.flight_origin}</span>
              </div>
              {returnDate && (
                <p className="text-xs text-muted-foreground">
                  {returnDate}
                  {trip.flight_return_time && ` · ${trip.flight_return_time}`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Price & Book */}
      <div className="mt-4 flex items-center justify-between">
        {trip.flight_price && (
          <p className="font-semibold">${trip.flight_price}</p>
        )}
        {trip.flight_purchase_url && (
          <Button asChild size="sm" variant="outline" className="lowercase">
            <a href={trip.flight_purchase_url} target="_blank" rel="noopener noreferrer">
              book flight
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Flight Placeholder
// =============================================================================

function FlightPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Plane className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium lowercase">flights</h3>
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center py-4">
        flights coming soon
      </p>
    </div>
  )
}

// =============================================================================
// Hotel Placeholder
// =============================================================================

function HotelPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Building2 className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium lowercase">hotel</h3>
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center py-4">
        hotel coming soon
      </p>
    </div>
  )
}

// =============================================================================
// Hotel Section
// =============================================================================

function HotelSection({ trip }: { trip: TripDetail }) {
  const checkIn = trip.hotel_check_in ? formatShortDate(trip.hotel_check_in) : null
  const checkOut = trip.hotel_check_out ? formatShortDate(trip.hotel_check_out) : null

  // Calculate nights
  let nights: number | null = null
  if (trip.hotel_check_in && trip.hotel_check_out) {
    const inDate = new Date(trip.hotel_check_in)
    const outDate = new Date(trip.hotel_check_out)
    nights = Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Building2 className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-medium lowercase">hotel</h3>
          {nights && (
            <p className="text-xs text-muted-foreground">{nights} night{nights > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Hotel Details */}
      <div className="space-y-3">
        <p className="font-medium lowercase">{trip.hotel_name}</p>

        {(checkIn || checkOut) && (
          <div className="flex items-center gap-4 text-sm">
            {checkIn && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">check-in</p>
                  <p className="font-medium">{checkIn}</p>
                </div>
              </div>
            )}
            {checkOut && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">check-out</p>
                  <p className="font-medium">{checkOut}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price & Book */}
      <div className="mt-4 flex items-center justify-between">
        {trip.hotel_price && (
          <p className="font-semibold">${trip.hotel_price}</p>
        )}
        {trip.hotel_purchase_url && (
          <Button asChild size="sm" variant="outline" className="lowercase">
            <a href={trip.hotel_purchase_url} target="_blank" rel="noopener noreferrer">
              book hotel
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Notes Section
// =============================================================================

function NotesSection({ notes }: { notes: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-medium lowercase mb-3">notes</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
    </div>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatFullDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toLowerCase()
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00')
  return date
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toLowerCase()
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
