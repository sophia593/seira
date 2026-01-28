'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plane, Hotel, ChevronDown, ChevronUp, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { getApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { EventAnchor, type EventData } from './event-anchor'
import { ProgressStrip, type TripComponentStatuses } from './progress-strip'
import { FlightSearch } from '@/components/flights'
import { HotelSearch } from '@/components/hotels'
import type { FlightOffer } from '@/hooks/use-flight-search'
import type { HotelOffer } from '@/hooks/use-hotel-search'

// =============================================================================
// Types
// =============================================================================

interface TripData {
  id: string
  user_id: string
  title: string
  status: 'draft' | 'quoted' | 'booked' | 'completed' | 'cancelled'

  // Event
  event_name: string | null
  event_date: string | null
  event_time: string | null
  event_venue: string | null
  event_venue_address: string | null
  event_price_estimate: number | null
  event_purchase_url: string | null
  event_provider: string | null
  event_provider_id: string | null

  // Flight
  flight_origin: string | null
  flight_destination: string | null
  flight_outbound_date: string | null
  flight_outbound_time: string | null
  flight_return_date: string | null
  flight_return_time: string | null
  flight_price: number | null
  flight_carrier: string | null
  flight_purchase_url: string | null

  // Hotel
  hotel_name: string | null
  hotel_check_in: string | null
  hotel_check_out: string | null
  hotel_price: number | null
  hotel_purchase_url: string | null

  // Meta
  destination_city: string | null
  destination_country: string | null
  estimated_total: number | null
  notes: string | null
  conversation_id: string | null
  created_at: string
  updated_at: string
}

type LoadingState = 'loading' | 'not-found' | 'error' | 'ready'

// =============================================================================
// Main Page
// =============================================================================

export default function TripBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')

  // Section expansion state
  const [flightSectionOpen, setFlightSectionOpen] = useState(false)
  const [hotelSectionOpen, setHotelSectionOpen] = useState(false)

  // Loading states for updates
  const [isUpdatingFlight, setIsUpdatingFlight] = useState(false)
  const [isUpdatingHotel, setIsUpdatingHotel] = useState(false)

  const fetchTrip = useCallback(async () => {
    const supabase = createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      toast.error('please sign in to view this trip')
      router.push('/login')
      return
    }

    // Fetch trip
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        setLoadingState('not-found')
      } else {
        console.error('Error fetching trip:', error)
        setLoadingState('error')
      }
      return
    }

    if (data.user_id !== user.id) {
      setLoadingState('not-found')
      return
    }

    setTrip(data)
    setLoadingState('ready')

    // Auto-expand sections that need attention
    if (!data.flight_origin) {
      setFlightSectionOpen(true)
    } else if (!data.hotel_name) {
      setHotelSectionOpen(true)
    }
  }, [tripId, router])

  useEffect(() => {
    setLoadingState('loading')
    fetchTrip()
  }, [fetchTrip])

  // ===========================================================================
  // Flight Selection Handler
  // ===========================================================================

  const handleFlightSelect = async (offer: FlightOffer) => {
    if (!trip || isUpdatingFlight) return

    setIsUpdatingFlight(true)

    try {
      const api = getApi()

      // Extract flight details from offer
      const outboundFirst = offer.outbound_segments[0]
      const outboundLast = offer.outbound_segments[offer.outbound_segments.length - 1]
      const returnFirst = offer.return_segments?.[0]

      // Update trip with flight data
      await api.updateTrip(trip.id, {
        flight_origin: outboundFirst.departure_airport,
        flight_destination: outboundLast.arrival_airport,
        flight_outbound_date: outboundFirst.departure_time.split('T')[0],
        flight_outbound_time: outboundFirst.departure_time.split('T')[1]?.slice(0, 5),
        flight_return_date: returnFirst ? returnFirst.departure_time.split('T')[0] : null,
        flight_return_time: returnFirst ? returnFirst.departure_time.split('T')[1]?.slice(0, 5) : null,
        flight_price: offer.price,
        flight_carrier: offer.validating_carrier_name || offer.validating_carrier,
      })

      toast.success('flight added to trip')

      // Refresh trip data
      await fetchTrip()

      // Collapse flight section, open hotel
      setFlightSectionOpen(false)
      if (!trip.hotel_name) {
        setHotelSectionOpen(true)
      }

    } catch (error) {
      console.error('Failed to update trip:', error)
      toast.error('failed to add flight')
    } finally {
      setIsUpdatingFlight(false)
    }
  }

  // ===========================================================================
  // Clear Flight Handler
  // ===========================================================================

  const handleClearFlight = async () => {
    if (!trip) return

    try {
      const api = getApi()
      await api.updateTrip(trip.id, {
        flight_origin: null,
        flight_destination: null,
        flight_outbound_date: null,
        flight_outbound_time: null,
        flight_return_date: null,
        flight_return_time: null,
        flight_price: null,
        flight_carrier: null,
      })

      toast.success('flight removed')
      await fetchTrip()
      setFlightSectionOpen(true)

    } catch (error) {
      console.error('Failed to clear flight:', error)
      toast.error('failed to remove flight')
    }
  }

  // ===========================================================================
  // Hotel Selection Handler
  // ===========================================================================

  const handleHotelSelect = async (offer: HotelOffer) => {
    if (!trip || isUpdatingHotel) return

    setIsUpdatingHotel(true)

    try {
      const api = getApi()

      // Update trip with hotel data
      await api.updateTrip(trip.id, {
        hotel_name: offer.hotel_name,
        hotel_check_in: offer.check_in,
        hotel_check_out: offer.check_out,
        hotel_price: offer.price,
      })

      toast.success('hotel added to trip')

      // Refresh trip data
      await fetchTrip()

      // Collapse hotel section
      setHotelSectionOpen(false)

    } catch (error) {
      console.error('Failed to update trip:', error)
      toast.error('failed to add hotel')
    } finally {
      setIsUpdatingHotel(false)
    }
  }

  // ===========================================================================
  // Clear Hotel Handler
  // ===========================================================================

  const handleClearHotel = async () => {
    if (!trip) return

    try {
      const api = getApi()
      await api.updateTrip(trip.id, {
        hotel_name: null,
        hotel_check_in: null,
        hotel_check_out: null,
        hotel_price: null,
      })

      toast.success('hotel removed')
      await fetchTrip()
      setHotelSectionOpen(true)

    } catch (error) {
      console.error('Failed to clear hotel:', error)
      toast.error('failed to remove hotel')
    }
  }

  // ===========================================================================
  // Loading State
  // ===========================================================================

  if (loadingState === 'loading') {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ===========================================================================
  // Not Found State
  // ===========================================================================

  if (loadingState === 'not-found') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-semibold mb-2 lowercase">trip not found</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          this trip doesn't exist or you don't have access to it
        </p>
        <Link
          href="/trips"
          className="text-sm text-primary hover:underline lowercase"
        >
          ← back to trips
        </Link>
      </div>
    )
  }

  // ===========================================================================
  // Error State
  // ===========================================================================

  if (loadingState === 'error' || !trip) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-semibold mb-2 lowercase">something went wrong</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          couldn't load this trip. please try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:underline lowercase"
        >
          refresh page
        </button>
      </div>
    )
  }

  // ===========================================================================
  // Ready State - Trip Builder Workspace
  // ===========================================================================

  const hasEvent = !!trip.event_name
  const hasFlights = !!trip.flight_origin
  const hasHotel = !!trip.hotel_name

  // Build component statuses for progress strip
  const componentStatuses: TripComponentStatuses = {
    event: { resolved: hasEvent },
    flights: { resolved: hasFlights, skipped: false },
    hotel: { resolved: hasHotel, skipped: false },
  }

  // Calculate estimated total
  const estimatedTotal = [
    trip.event_price_estimate,
    trip.flight_price,
    trip.hotel_price,
  ].filter((p): p is number => p !== null && p !== undefined).reduce((sum, price) => sum + price, 0)

  function handleReviewClick() {
    router.push(`/trip/${tripId}/review`)
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Link */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          back to trips
        </Link>

        {/* Event Anchor (Pinned at Top) */}
        {hasEvent && (
          <EventAnchor
            event={{
              name: trip.event_name!,
              date: trip.event_date,
              time: trip.event_time,
              venue: trip.event_venue,
              city: trip.destination_city,
              ticketUrl: trip.event_purchase_url,
            }}
            className="mb-4"
          />
        )}

        {/* Progress Strip */}
        <ProgressStrip
          statuses={componentStatuses}
          onReviewClick={handleReviewClick}
          className="mb-6"
        />

        {/* Trip Builder Sections */}
        <div className="space-y-4">
          {/* ================================================================= */}
          {/* Flights Section */}
          {/* ================================================================= */}
          <section className="rounded-xl border bg-card overflow-hidden">
            {/* Header - Always visible */}
            <button
              onClick={() => setFlightSectionOpen(!flightSectionOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  hasFlights ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                )}>
                  <Plane className={cn(
                    'w-5 h-5',
                    hasFlights ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="text-left">
                  <h2 className="font-medium lowercase flex items-center gap-2">
                    flights
                    {hasFlights && <Check className="w-4 h-4 text-green-600" />}
                  </h2>
                  {hasFlights ? (
                    <p className="text-sm text-muted-foreground">
                      {trip.flight_origin} → {trip.flight_destination} · ${trip.flight_price}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      search and add flights
                    </p>
                  )}
                </div>
              </div>
              {flightSectionOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Expanded Content */}
            {flightSectionOpen && (
              <div className="border-t">
                {hasFlights ? (
                  // Show selected flight details
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">
                          {trip.flight_origin} → {trip.flight_destination}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {trip.flight_carrier}
                        </p>
                      </div>
                      <p className="text-lg font-bold">${trip.flight_price}</p>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Depart: {formatDate(trip.flight_outbound_date!)} {trip.flight_outbound_time && `at ${trip.flight_outbound_time}`}</p>
                      {trip.flight_return_date && (
                        <p>Return: {formatDate(trip.flight_return_date)} {trip.flight_return_time && `at ${trip.flight_return_time}`}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFlight}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Change Flight
                    </Button>
                  </div>
                ) : (
                  // Show flight search
                  <div className="p-5">
                    {isUpdatingFlight && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                    <FlightSearch
                      onFlightSelect={handleFlightSelect}
                      defaultDestination={trip.destination_city ? getAirportCode(trip.destination_city) : ''}
                      defaultDepartureDate={trip.event_date ? getDayBefore(trip.event_date) : ''}
                      defaultReturnDate={trip.event_date ? getDayAfter(trip.event_date) : ''}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* Hotel Section */}
          {/* ================================================================= */}
          <section className="rounded-xl border bg-card overflow-hidden">
            {/* Header - Always visible */}
            <button
              onClick={() => setHotelSectionOpen(!hotelSectionOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  hasHotel ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                )}>
                  <Hotel className={cn(
                    'w-5 h-5',
                    hasHotel ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="text-left">
                  <h2 className="font-medium lowercase flex items-center gap-2">
                    hotel
                    {hasHotel && <Check className="w-4 h-4 text-green-600" />}
                  </h2>
                  {hasHotel ? (
                    <p className="text-sm text-muted-foreground">
                      {trip.hotel_name} · ${trip.hotel_price}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      search and add hotel
                    </p>
                  )}
                </div>
              </div>
              {hotelSectionOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Expanded Content */}
            {hotelSectionOpen && (
              <div className="border-t">
                {hasHotel ? (
                  // Show selected hotel details
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">{trip.hotel_name}</p>
                      </div>
                      <p className="text-lg font-bold">${trip.hotel_price}</p>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Check-in: {formatDate(trip.hotel_check_in!)}</p>
                      <p>Check-out: {formatDate(trip.hotel_check_out!)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearHotel}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Change Hotel
                    </Button>
                  </div>
                ) : (
                  // Show hotel search
                  <div className="p-5">
                    {isUpdatingHotel && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                    <HotelSearch
                      onHotelSelect={handleHotelSelect}
                      defaultCity={trip.destination_city || ''}
                      defaultCheckIn={trip.event_date ? getDayBefore(trip.event_date) : ''}
                      defaultCheckOut={trip.event_date ? getDayAfter(trip.event_date) : ''}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* Total */}
          {/* ================================================================= */}
          {estimatedTotal > 0 && (
            <div className="rounded-xl border bg-muted/50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">estimated total</span>
                <span className="text-xl font-semibold">
                  ${estimatedTotal.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {trip.event_price_estimate && (
                  <div className="flex justify-between">
                    <span>Event</span>
                    <span>${trip.event_price_estimate}</span>
                  </div>
                )}
                {trip.flight_price && (
                  <div className="flex justify-between">
                    <span>Flights</span>
                    <span>${trip.flight_price}</span>
                  </div>
                )}
                {trip.hotel_price && (
                  <div className="flex justify-between">
                    <span>Hotel</span>
                    <span>${trip.hotel_price}</span>
                  </div>
                )}
              </div>
            </div>
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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toLowerCase()
}

function getDayBefore(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

function getDayAfter(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

// Simple city to airport code mapping (could be expanded or use an API)
function getAirportCode(city: string): string {
  const cityToAirport: Record<string, string> = {
    'los angeles': 'LAX',
    'new york': 'JFK',
    'chicago': 'ORD',
    'san francisco': 'SFO',
    'miami': 'MIA',
    'boston': 'BOS',
    'seattle': 'SEA',
    'denver': 'DEN',
    'atlanta': 'ATL',
    'dallas': 'DFW',
    'phoenix': 'PHX',
    'las vegas': 'LAS',
    'orlando': 'MCO',
    'philadelphia': 'PHL',
    'houston': 'IAH',
    'minneapolis': 'MSP',
    'detroit': 'DTW',
    'san diego': 'SAN',
    'tampa': 'TPA',
    'portland': 'PDX',
  }

  const normalized = city.toLowerCase()
  return cityToAirport[normalized] || ''
}
