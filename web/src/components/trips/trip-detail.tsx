'use client'

import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Building2,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type TripDetail, type RefreshQuotesResponse } from '@/lib/api'
import { EventDetailCard } from './event-detail-card'
import { FlightsSection } from './flights-section'
import { type TripEventFlat, type TripFlightFlat } from '@/types/trip'

// =============================================================================
// Types
// =============================================================================

interface TripDetailProps {
  trip: TripDetail
  className?: string
  onRefreshQuotes?: () => Promise<void>
  isRefreshing?: boolean
  refreshResult?: RefreshQuotesResponse | null
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

export function TripDetailComponent({
  trip,
  className,
  onRefreshQuotes,
  isRefreshing,
  refreshResult,
}: TripDetailProps) {
  const destination = [trip.destination_city, trip.destination_country]
    .filter(Boolean)
    .join(', ')

  const hasEvent = !!trip.event_name
  const hasFlight = !!trip.flight_origin
  const hasHotel = !!trip.hotel_name

  // Convert flat trip data to component props
  const eventData: TripEventFlat | null = hasEvent ? {
    name: trip.event_name!,
    date: trip.event_date,
    time: trip.event_time,
    venue: trip.event_venue,
    venue_address: trip.event_venue_address,
    price_estimate: trip.event_price_estimate,
    purchase_url: trip.event_purchase_url,
  } : null

  const outboundFlight: TripFlightFlat | null = hasFlight ? {
    direction: 'outbound',
    origin: trip.flight_origin,
    destination: trip.flight_destination,
    date: trip.flight_outbound_date,
    time: trip.flight_outbound_time,
    carrier: trip.flight_carrier,
    price: trip.flight_price,
    purchase_url: trip.flight_purchase_url,
  } : null

  const returnFlight: TripFlightFlat | null = trip.flight_return_date ? {
    direction: 'return',
    origin: trip.flight_destination,
    destination: trip.flight_origin,
    date: trip.flight_return_date,
    time: trip.flight_return_time,
    carrier: trip.flight_carrier,
    price: null, // Return flight price usually included in round-trip
    purchase_url: trip.flight_purchase_url,
  } : null

  // Check if trip has a Ticketmaster event that can be refreshed
  const canRefresh = trip.event_provider === 'ticketmaster' && !!trip.event_provider_id

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <TripHeader
        trip={trip}
        destination={destination}
        canRefresh={canRefresh}
        onRefreshQuotes={onRefreshQuotes}
        isRefreshing={isRefreshing}
        refreshResult={refreshResult}
      />

      {/* Event Section - Using standalone component */}
      {eventData && <EventDetailCard event={eventData} />}

      {/* Flights Section - Using standalone component */}
      {hasFlight && (
        <FlightsSection
          outboundFlight={outboundFlight}
          returnFlight={returnFlight}
        />
      )}

      {/* Hotel Section */}
      {hasHotel ? <HotelSection trip={trip} /> : hasFlight && <HotelPlaceholder />}

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

interface TripHeaderProps {
  trip: TripDetail
  destination: string
  canRefresh?: boolean
  onRefreshQuotes?: () => Promise<void>
  isRefreshing?: boolean
  refreshResult?: RefreshQuotesResponse | null
}

function TripHeader({
  trip,
  destination,
  canRefresh,
  onRefreshQuotes,
  isRefreshing,
  refreshResult,
}: TripHeaderProps) {
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
          <div className="flex items-center gap-3">
            {trip.status === 'quoted' && trip.quote_expires_at && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">quote expires</p>
                <p className="text-sm font-medium">{formatShortDate(trip.quote_expires_at)}</p>
              </div>
            )}
            {canRefresh && onRefreshQuotes && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshQuotes}
                disabled={isRefreshing}
                className="lowercase"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                {isRefreshing ? 'refreshing...' : 'refresh prices'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Refresh Result Message */}
      {refreshResult && (
        <PriceChangeMessage result={refreshResult} />
      )}
    </div>
  )
}

// =============================================================================
// Price Change Message
// =============================================================================

function PriceChangeMessage({ result }: { result: RefreshQuotesResponse }) {
  const { price_change, previous_price, new_price } = result

  if (price_change === null || price_change === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
        <Minus className="w-4 h-4" />
        <span>prices unchanged</span>
      </div>
    )
  }

  const isIncrease = price_change > 0
  const Icon = isIncrease ? TrendingUp : TrendingDown
  const colorClass = isIncrease
    ? 'bg-destructive/10 text-destructive'
    : 'bg-green-500/10 text-green-600 dark:text-green-400'

  return (
    <div className={cn("flex items-center gap-2 p-3 rounded-lg text-sm", colorClass)}>
      <Icon className="w-4 h-4" />
      <span>
        price {isIncrease ? 'increased' : 'decreased'} by ${Math.abs(price_change).toFixed(2)}
        {previous_price !== null && new_price !== null && (
          <span className="text-xs ml-1 opacity-75">
            (${previous_price.toFixed(2)} → ${new_price.toFixed(2)})
          </span>
        )}
      </span>
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
