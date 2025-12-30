'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Plane,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'
import { getApi, type TripDetail } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// =============================================================================
// Main Page
// =============================================================================

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrip() {
      try {
        const api = getApi()
        const data = await api.getTrip(tripId)
        setTrip(data)
      } catch (err) {
        console.error('Failed to fetch trip:', err)
        setError('failed to load trip')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [tripId])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !trip) {
    return <ErrorState message={error || 'trip not found'} />
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          back to trips
        </Link>

        {/* Header */}
        <TripHeader trip={trip} />

        {/* Content sections */}
        <div className="space-y-6 mt-8">
          {/* Event */}
          {trip.event_name && <EventSection trip={trip} />}

          {/* Flight */}
          {trip.flight_origin && <FlightSection trip={trip} />}

          {/* Hotel */}
          {trip.hotel_name && <HotelSection trip={trip} />}

          {/* Notes */}
          {trip.notes && <NotesSection notes={trip.notes} />}

          {/* Continue conversation */}
          {trip.conversation_id && (
            <Button asChild variant="outline" className="w-full lowercase">
              <Link href={`/chat/${trip.conversation_id}`}>
                <MessageSquare className="w-4 h-4 mr-2" />
                continue planning in chat
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Trip Header
// =============================================================================

const STATUS_STYLES: Record<TripDetail['status'], { bg: string; text: string }> = {
  draft: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' },
  quoted: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  booked: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  completed: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
}

function TripHeader({ trip }: { trip: TripDetail }) {
  const styles = STATUS_STYLES[trip.status]
  const destination = [trip.destination_city, trip.destination_country]
    .filter(Boolean)
    .join(', ')

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-page-title">{trip.title || trip.event_name || 'untitled trip'}</h1>
          {destination && (
            <p className="text-muted-foreground mt-1 lowercase">{destination}</p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium lowercase',
            styles.bg,
            styles.text
          )}
        >
          {trip.status}
        </span>
      </div>

      {/* Price summary */}
      {trip.estimated_total && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">estimated total</p>
          <p className="text-2xl font-semibold">
            ${trip.estimated_total.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Event Section
// =============================================================================

function EventSection({ trip }: { trip: TripDetail }) {
  const formattedDate = trip.event_date ? formatFullDate(trip.event_date) : null
  const formattedTime = trip.event_time ? formatTime(trip.event_time) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-title flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          event
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-medium">{trip.event_name}</p>

        {trip.event_venue && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="lowercase">{trip.event_venue}</p>
              {trip.event_venue_address && (
                <p className="lowercase">{trip.event_venue_address}</p>
              )}
            </div>
          </div>
        )}

        {formattedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
            {formattedTime && (
              <>
                <Clock className="w-4 h-4 ml-2" />
                <span>{formattedTime}</span>
              </>
            )}
          </div>
        )}

        {trip.event_price_estimate && (
          <p className="text-sm">
            <span className="text-muted-foreground">tickets: </span>
            <span className="font-medium">${trip.event_price_estimate}</span>
          </p>
        )}

        {trip.event_purchase_url && (
          <Button asChild size="sm" variant="outline" className="lowercase">
            <a href={trip.event_purchase_url} target="_blank" rel="noopener noreferrer">
              view tickets
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Flight Section
// =============================================================================

function FlightSection({ trip }: { trip: TripDetail }) {
  const outboundDate = trip.flight_outbound_date
    ? formatShortDate(trip.flight_outbound_date)
    : null
  const returnDate = trip.flight_return_date
    ? formatShortDate(trip.flight_return_date)
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-title flex items-center gap-2">
          <Plane className="w-5 h-5" />
          flights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outbound */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">outbound</p>
            <p className="font-medium">
              {trip.flight_origin} → {trip.flight_destination}
            </p>
            {outboundDate && (
              <p className="text-sm text-muted-foreground">
                {outboundDate}
                {trip.flight_outbound_time && ` · ${trip.flight_outbound_time}`}
              </p>
            )}
          </div>
        </div>

        {/* Return */}
        {trip.flight_return_date && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">return</p>
              <p className="font-medium">
                {trip.flight_destination} → {trip.flight_origin}
              </p>
              {returnDate && (
                <p className="text-sm text-muted-foreground">
                  {returnDate}
                  {trip.flight_return_time && ` · ${trip.flight_return_time}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Carrier and price */}
        <div className="flex items-center justify-between pt-2 border-t">
          {trip.flight_carrier && (
            <p className="text-sm text-muted-foreground">{trip.flight_carrier}</p>
          )}
          {trip.flight_price && (
            <p className="font-medium">${trip.flight_price}</p>
          )}
        </div>

        {trip.flight_purchase_url && (
          <Button asChild size="sm" variant="outline" className="lowercase">
            <a href={trip.flight_purchase_url} target="_blank" rel="noopener noreferrer">
              book flight
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Hotel Section
// =============================================================================

function HotelSection({ trip }: { trip: TripDetail }) {
  const checkIn = trip.hotel_check_in ? formatShortDate(trip.hotel_check_in) : null
  const checkOut = trip.hotel_check_out ? formatShortDate(trip.hotel_check_out) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-title flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          hotel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-medium">{trip.hotel_name}</p>

        {(checkIn || checkOut) && (
          <p className="text-sm text-muted-foreground">
            {checkIn && `check-in: ${checkIn}`}
            {checkIn && checkOut && ' · '}
            {checkOut && `check-out: ${checkOut}`}
          </p>
        )}

        {trip.hotel_price && (
          <p className="text-sm">
            <span className="text-muted-foreground">price: </span>
            <span className="font-medium">${trip.hotel_price}</span>
          </p>
        )}

        {trip.hotel_purchase_url && (
          <Button asChild size="sm" variant="outline" className="lowercase">
            <a href={trip.hotel_purchase_url} target="_blank" rel="noopener noreferrer">
              book hotel
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Notes Section
// =============================================================================

function NotesSection({ notes }: { notes: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-title">notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{notes}</p>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-8 w-2/3 bg-muted rounded" />
            <div className="h-4 w-1/3 bg-muted rounded" />
          </div>
          <div className="h-24 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Error State
// =============================================================================

function ErrorState({ message }: { message: string }) {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          back to trips
        </Link>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4">{message}</p>
          <Button asChild variant="outline" className="lowercase">
            <Link href="/trips">return to trips</Link>
          </Button>
        </div>
      </div>
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
  const date = new Date(dateString + 'T00:00:00')
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
