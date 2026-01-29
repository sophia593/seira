'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Loader2, Plane, Hotel, ChevronDown, ChevronUp, X, Check, Ticket, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { getApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { EventAnchor, type EventData } from './event-anchor'
import { ProgressStrip, type TripComponentStatuses } from './progress-strip'
import type { FlightPickerConstraints } from './flight-picker'
import type { HotelPickerConstraints } from './hotel-picker'
import type { FlightOffer } from '@/hooks/use-flight-search'
import type { HotelOffer } from '@/hooks/use-hotel-search'

// Lazy load heavy picker components (only loaded when user opens them)
const FlightPicker = dynamic(
  () => import('./flight-picker').then((mod) => ({ default: mod.FlightPicker })),
  { ssr: false }
)
const HotelPicker = dynamic(
  () => import('./hotel-picker').then((mod) => ({ default: mod.HotelPicker })),
  { ssr: false }
)
const ShareModal = dynamic(
  () => import('./share-modal').then((mod) => ({ default: mod.ShareModal })),
  { ssr: false }
)

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
  share_token: string | null
  shared_by_name: string | null
  created_at: string
  updated_at: string
}

type LoadingState = 'loading' | 'not-found' | 'error' | 'ready'

type BadgeStatus = 'selected' | 'not-needed' | 'needs-decision'

// =============================================================================
// Status Badge Component
// =============================================================================

function StatusBadge({ status }: { status: BadgeStatus }) {
  if (status === 'selected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Check className="w-3 h-3" />
        selected
      </span>
    )
  }

  if (status === 'not-needed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        not needed
      </span>
    )
  }

  // needs-decision
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      needs decision
    </span>
  )
}

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

  // Picker state
  const [flightPickerOpen, setFlightPickerOpen] = useState(false)
  const [hotelPickerOpen, setHotelPickerOpen] = useState(false)

  // Loading states for updates
  const [isUpdatingFlight, setIsUpdatingFlight] = useState(false)
  const [isUpdatingHotel, setIsUpdatingHotel] = useState(false)

  // Skipped states (persisted in localStorage)
  const [flightSkipped, setFlightSkipped] = useState(false)
  const [hotelSkipped, setHotelSkipped] = useState(false)

  // Load skipped states from localStorage
  useEffect(() => {
    if (tripId) {
      const savedFlightSkipped = localStorage.getItem(`trip-${tripId}-flight-skipped`)
      const savedHotelSkipped = localStorage.getItem(`trip-${tripId}-hotel-skipped`)
      if (savedFlightSkipped === 'true') setFlightSkipped(true)
      if (savedHotelSkipped === 'true') setHotelSkipped(true)
    }
  }, [tripId])

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
  // Status Update Helper
  // ===========================================================================

  const updateTripStatus = useCallback(async (
    currentTrip: TripData,
    flightResolved: boolean,
    hotelResolved: boolean
  ) => {
    const hasEvent = !!currentTrip.event_name
    const allResolved = hasEvent && flightResolved && hotelResolved

    // Update to 'quoted' (ready) when all components are resolved
    if (allResolved && currentTrip.status === 'draft') {
      try {
        const api = getApi()
        await api.updateTrip(currentTrip.id, { status: 'quoted' })
      } catch (error) {
        console.error('Failed to update trip status:', error)
      }
    }
  }, [])

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

      // Check if trip is now ready (all components resolved)
      const hotelResolved = !!trip.hotel_name || hotelSkipped
      await updateTripStatus(trip, true, hotelResolved)

      // Close picker
      setFlightPickerOpen(false)

      // Open hotel section if not already selected
      if (!trip.hotel_name && !hotelSkipped) {
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

      // Check if trip is now ready (all components resolved)
      const flightResolved = !!trip.flight_origin || flightSkipped
      await updateTripStatus(trip, flightResolved, true)

      // Close picker
      setHotelPickerOpen(false)

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
  // Skip Handlers
  // ===========================================================================

  const handleSkipFlight = async () => {
    setFlightSkipped(true)
    setFlightSectionOpen(false)
    setFlightPickerOpen(false)
    localStorage.setItem(`trip-${tripId}-flight-skipped`, 'true')
    toast.success('flights marked as not needed')

    // Check if trip is now ready
    if (trip) {
      const hotelResolved = !!trip.hotel_name || hotelSkipped
      await updateTripStatus(trip, true, hotelResolved)
    }
  }

  const handleUnskipFlight = () => {
    setFlightSkipped(false)
    setFlightSectionOpen(true)
    setFlightPickerOpen(true)
    localStorage.removeItem(`trip-${tripId}-flight-skipped`)
  }

  const handleSkipHotel = async () => {
    setHotelSkipped(true)
    setHotelSectionOpen(false)
    setHotelPickerOpen(false)
    localStorage.setItem(`trip-${tripId}-hotel-skipped`, 'true')
    toast.success('hotel marked as not needed')

    // Check if trip is now ready
    if (trip) {
      const flightResolved = !!trip.flight_origin || flightSkipped
      await updateTripStatus(trip, flightResolved, true)
    }
  }

  const handleUnskipHotel = () => {
    setHotelSkipped(false)
    setHotelSectionOpen(true)
    setHotelPickerOpen(true)
    localStorage.removeItem(`trip-${tripId}-hotel-skipped`)
  }

  // ===========================================================================
  // Loading State
  // ===========================================================================

  if (loadingState === 'loading') {
    return (
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          </div>

          {/* Event anchor skeleton */}
          <div className="rounded-xl border bg-card p-4 mb-3 sm:mb-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            </div>
          </div>

          {/* Progress strip skeleton */}
          <div className="h-16 rounded-lg border bg-card mb-4 sm:mb-6 animate-pulse" />

          {/* Sections skeleton */}
          <div className="space-y-3 sm:space-y-4">
            <div className="h-20 rounded-lg sm:rounded-xl border bg-card animate-pulse" style={{ animationDelay: '100ms' }} />
            <div className="h-20 rounded-lg sm:rounded-xl border bg-card animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
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
    flights: { resolved: hasFlights || flightSkipped, skipped: flightSkipped },
    hotel: { resolved: hasHotel || hotelSkipped, skipped: hotelSkipped },
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header with back link and share */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link
            href="/trips"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            back to trips
          </Link>

          <ShareModal
            tripId={trip.id}
            existingShareToken={trip.share_token}
            userName={trip.shared_by_name}
          />
        </div>

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
            className="mb-3 sm:mb-4"
          />
        )}

        {/* Progress Strip */}
        <ProgressStrip
          statuses={componentStatuses}
          onReviewClick={handleReviewClick}
          className="mb-4 sm:mb-6"
        />

        {/* Trip Builder Sections */}
        <div className="space-y-3 sm:space-y-4">
          {/* ================================================================= */}
          {/* Flights Section */}
          {/* ================================================================= */}
          <section className="rounded-lg sm:rounded-xl border bg-card overflow-hidden">
            {hasFlights ? (
              <>
                {/* Header with flight info */}
                <button
                  onClick={() => setFlightSectionOpen(!flightSectionOpen)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Plane className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-medium lowercase">flights</h2>
                        <StatusBadge status="selected" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {trip.flight_origin} → {trip.flight_destination} · ${trip.flight_price}
                      </p>
                    </div>
                  </div>
                  {flightSectionOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded flight details */}
                {flightSectionOpen && (
                  <div className="border-t p-4 sm:p-5">
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
                )}
              </>
            ) : flightSkipped ? (
              /* Skipped state */
              <button
                onClick={handleUnskipFlight}
                className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Plane className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-medium lowercase">flights</h2>
                      <StatusBadge status="not-needed" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      skipped for this trip
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Add flights
                </span>
              </button>
            ) : (
              <>
                {/* Empty state - opens picker */}
                <button
                  onClick={() => setFlightPickerOpen(true)}
                  className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 group-hover:bg-primary/10 transition-colors">
                      <Plane className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-medium lowercase">flights</h2>
                        <StatusBadge status="needs-decision" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        not added yet
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    + Add flights
                  </span>
                </button>
              </>
            )}
          </section>

          {/* ================================================================= */}
          {/* Hotel Section */}
          {/* ================================================================= */}
          <section className="rounded-lg sm:rounded-xl border bg-card overflow-hidden">
            {hasHotel ? (
              <>
                {/* Header with hotel info */}
                <button
                  onClick={() => setHotelSectionOpen(!hotelSectionOpen)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Hotel className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-medium lowercase">hotel</h2>
                        <StatusBadge status="selected" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {trip.hotel_name} · ${trip.hotel_price}
                      </p>
                    </div>
                  </div>
                  {hotelSectionOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded hotel details */}
                {hotelSectionOpen && (
                  <div className="border-t p-4 sm:p-5">
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
                )}
              </>
            ) : hotelSkipped ? (
              /* Skipped state */
              <button
                onClick={handleUnskipHotel}
                className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Hotel className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-medium lowercase">hotel</h2>
                      <StatusBadge status="not-needed" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      skipped for this trip
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Add hotel
                </span>
              </button>
            ) : (
              <>
                {/* Empty state - collapsed */}
                {/* Empty state - opens picker */}
                <button
                  onClick={() => setHotelPickerOpen(true)}
                  className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 group-hover:bg-primary/10 transition-colors">
                      <Hotel className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-medium lowercase">hotel</h2>
                        <StatusBadge status="needs-decision" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        not added yet
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    + Add hotel
                  </span>
                </button>
              </>
            )}
          </section>

          {/* ================================================================= */}
          {/* Cost Estimate */}
          {/* ================================================================= */}
          <section className="rounded-lg sm:rounded-xl border bg-card overflow-hidden">
            <div className="p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-medium lowercase">cost estimate</h2>
                  <p className="text-sm text-muted-foreground">
                    {estimatedTotal > 0 ? 'based on your selections' : 'add items to see estimate'}
                  </p>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-3">
                {/* Tickets */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Tickets</span>
                  </div>
                  {trip.event_price_estimate ? (
                    <span className="text-sm font-medium">${trip.event_price_estimate.toLocaleString()}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">—</span>
                  )}
                </div>

                {/* Flights */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Flights</span>
                  </div>
                  {trip.flight_price ? (
                    <span className="text-sm font-medium">${trip.flight_price.toLocaleString()}</span>
                  ) : flightSkipped ? (
                    <span className="text-sm text-muted-foreground">Not needed</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Select flights</span>
                  )}
                </div>

                {/* Hotel */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Hotel</span>
                  </div>
                  {trip.hotel_price ? (
                    <span className="text-sm font-medium">${trip.hotel_price.toLocaleString()}</span>
                  ) : hotelSkipped ? (
                    <span className="text-sm text-muted-foreground">Not needed</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Select hotel</span>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium">Estimated Total</span>
                  {estimatedTotal > 0 ? (
                    <span className="text-xl font-bold">${estimatedTotal.toLocaleString()}</span>
                  ) : (
                    <span className="text-lg text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              {/* Note */}
              {estimatedTotal > 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                  Prices are estimates and may vary at time of booking.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Flight Picker */}
      <FlightPicker
        open={flightPickerOpen}
        onOpenChange={setFlightPickerOpen}
        onFlightSelect={handleFlightSelect}
        onSkip={handleSkipFlight}
        constraints={{
          eventCity: trip.destination_city,
          eventDate: trip.event_date,
          eventTime: trip.event_time,
          eventVenue: trip.event_venue,
          suggestedDestination: trip.destination_city ? getAirportCode(trip.destination_city) : '',
          suggestedDepartureDate: trip.event_date ? getDayBefore(trip.event_date) : '',
          suggestedReturnDate: trip.event_date ? getDayAfter(trip.event_date) : '',
        }}
        isUpdating={isUpdatingFlight}
      />

      {/* Hotel Picker */}
      <HotelPicker
        open={hotelPickerOpen}
        onOpenChange={setHotelPickerOpen}
        onHotelSelect={handleHotelSelect}
        onSkip={handleSkipHotel}
        constraints={{
          eventCity: trip.destination_city,
          eventDate: trip.event_date,
          eventVenue: trip.event_venue,
          suggestedCity: trip.destination_city || '',
          suggestedCheckIn: trip.event_date ? getDayBefore(trip.event_date) : '',
          suggestedCheckOut: trip.event_date ? getDayAfter(trip.event_date) : '',
        }}
        isUpdating={isUpdatingHotel}
      />
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
