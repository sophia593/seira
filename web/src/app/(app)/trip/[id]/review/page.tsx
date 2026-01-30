'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Plane,
  Hotel,
  Calendar,
  Clock,
  DollarSign,
  Ticket,
  Check,
  AlertTriangle,
  ExternalLink,
  PlaneTakeoff,
  PlaneLanding,
  Building,
  Music,
  PartyPopper,
  CheckCircle2,
  Share2,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { getApi } from '@/lib/api'
import { cn } from '@/lib/utils'

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
  created_at: string
  updated_at: string
}

type LoadingState = 'loading' | 'not-found' | 'error' | 'insufficient' | 'ready'

interface ConstraintCheck {
  label: string
  passed: boolean
  detail: string
}

// =============================================================================
// Main Page
// =============================================================================

export default function TripReviewPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [isMarkingBooked, setIsMarkingBooked] = useState(false)

  // Load skipped states from localStorage
  const [flightSkipped, setFlightSkipped] = useState(false)
  const [hotelSkipped, setHotelSkipped] = useState(false)

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

    // Check if trip is ready for review
    const hasEvent = !!data.event_name
    const hasFlights = !!data.flight_origin
    const hasHotel = !!data.hotel_name

    // Get skipped states
    const flightSkippedLocal = localStorage.getItem(`trip-${tripId}-flight-skipped`) === 'true'
    const hotelSkippedLocal = localStorage.getItem(`trip-${tripId}-hotel-skipped`) === 'true'

    const flightResolved = hasFlights || flightSkippedLocal
    const hotelResolved = hasHotel || hotelSkippedLocal

    if (!hasEvent || !flightResolved || !hotelResolved) {
      setLoadingState('insufficient')
    } else {
      setLoadingState('ready')
    }
  }, [tripId, router])

  useEffect(() => {
    setLoadingState('loading')
    fetchTrip()
  }, [fetchTrip])

  // ===========================================================================
  // Mark as Booked Handler
  // ===========================================================================

  const handleMarkBooked = async () => {
    if (!trip || isMarkingBooked) return

    setIsMarkingBooked(true)
    try {
      const api = getApi()
      await api.updateTrip(trip.id, { status: 'booked' })
      setTrip({ ...trip, status: 'booked' })
      toast.success('trip marked as booked!')
    } catch (error) {
      console.error('Failed to mark as booked:', error)
      toast.error('failed to update trip status')
    } finally {
      setIsMarkingBooked(false)
    }
  }

  // ===========================================================================
  // Loading State
  // ===========================================================================

  if (loadingState === 'loading') {
    return (
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
          </div>

          {/* Title skeleton */}
          <div className="h-8 w-3/4 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse mb-8" />

          {/* Timeline skeleton */}
          <div className="rounded-2xl border bg-card p-6 mb-6 animate-pulse">
            <div className="h-5 w-20 bg-muted rounded mb-4" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost breakdown skeleton */}
          <div className="rounded-2xl border bg-card p-6 animate-pulse" style={{ animationDelay: '100ms' }}>
            <div className="h-5 w-28 bg-muted rounded mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            </div>
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

  if (loadingState === 'error') {
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
  // Insufficient State - Redirect back to builder
  // ===========================================================================

  if (loadingState === 'insufficient') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4">
        <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-semibold mb-2 lowercase">trip not ready</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
          complete all decisions before reviewing. make sure you've selected or skipped flights and hotel.
        </p>
        <Button asChild>
          <Link href={`/trip/${tripId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            back to trip builder
          </Link>
        </Button>
      </div>
    )
  }

  if (!trip) return null

  // ===========================================================================
  // Ready State - Review Page
  // ===========================================================================

  const hasFlights = !!trip.flight_origin
  const hasHotel = !!trip.hotel_name
  const isBooked = trip.status === 'booked'

  // Build constraint checks
  const constraints = buildConstraintChecks(trip, flightSkipped, hotelSkipped)
  const allPassed = constraints.every((c) => c.passed)

  // Calculate costs
  const ticketCost = trip.event_price_estimate || 0
  const flightCost = trip.flight_price || 0
  const hotelCost = trip.hotel_price || 0
  const totalCost = ticketCost + flightCost + hotelCost

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Link */}
        <Link
          href={`/trip/${tripId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          back to trip builder
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold lowercase">
              {isBooked ? 'your trip is booked' : 'review your trip'}
            </h1>
            {isBooked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                booked
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-lg">{trip.title}</p>
        </header>

        <div className="space-y-6">
          {/* ================================================================= */}
          {/* Timeline */}
          {/* ================================================================= */}
          <section className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                trip timeline
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <Timeline trip={trip} flightSkipped={flightSkipped} hotelSkipped={hotelSkipped} />
            </div>
          </section>

          {/* ================================================================= */}
          {/* Plan Health Summary */}
          {/* ================================================================= */}
          <section className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/30">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold flex items-center gap-2.5">
                  {allPassed ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  plan health
                </h2>
                <span
                  className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
                    allPassed
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  )}
                >
                  {allPassed ? 'all checks passed' : 'review recommended'}
                </span>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {constraints.map((check, index) => (
                  <ConstraintRow key={index} check={check} />
                ))}
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* Cost Breakdown */}
          {/* ================================================================= */}
          <section className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2.5">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                cost breakdown
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-0">
                {/* Tickets */}
                <CostRow
                  icon={<Ticket className="w-4 h-4" />}
                  iconBg="bg-primary/10 text-primary"
                  title="event tickets"
                  subtitle={trip.event_name || 'event'}
                  amount={ticketCost}
                />

                {/* Flights */}
                <CostRow
                  icon={<Plane className="w-4 h-4" />}
                  iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  title="flights"
                  subtitle={
                    hasFlights
                      ? `${trip.flight_origin} → ${trip.flight_destination}`
                      : flightSkipped
                      ? 'not needed'
                      : 'not selected'
                  }
                  amount={flightCost}
                  muted={flightSkipped}
                />

                {/* Hotel */}
                <CostRow
                  icon={<Hotel className="w-4 h-4" />}
                  iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  title="hotel"
                  subtitle={
                    hasHotel
                      ? trip.hotel_name || 'hotel'
                      : hotelSkipped
                      ? 'not needed'
                      : 'not selected'
                  }
                  amount={hotelCost}
                  muted={hotelSkipped}
                  isLast
                />

                {/* Total */}
                <div className="flex items-center justify-between pt-5 mt-1 border-t">
                  <span className="text-lg font-semibold">estimated total</span>
                  <span className="text-2xl sm:text-3xl font-bold text-primary">
                    ${totalCost.toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground pt-3">
                  prices are estimates and may vary at time of booking.
                </p>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* Booking Links */}
          {/* ================================================================= */}
          <section className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2.5">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
                book your trip
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-muted-foreground mb-5">
                complete your bookings in order for the best experience.
              </p>
              <div className="space-y-3">
                {/* Step 1: Tickets */}
                <BookingLinkCard
                  step={1}
                  icon={<Ticket className="w-5 h-5" />}
                  iconBg="bg-primary/10 text-primary"
                  title="event tickets"
                  subtitle={trip.event_name || 'event'}
                  price={ticketCost}
                  url={trip.event_purchase_url}
                />

                {/* Step 2: Flights */}
                {hasFlights && (
                  <BookingLinkCard
                    step={2}
                    icon={<Plane className="w-5 h-5" />}
                    iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    title="flights"
                    subtitle={`${trip.flight_origin} → ${trip.flight_destination}${trip.flight_carrier ? ` · ${trip.flight_carrier}` : ''}`}
                    price={flightCost}
                    url={trip.flight_purchase_url}
                  />
                )}

                {/* Step 3: Hotel */}
                {hasHotel && (
                  <BookingLinkCard
                    step={hasFlights ? 3 : 2}
                    icon={<Hotel className="w-5 h-5" />}
                    iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    title="hotel"
                    subtitle={trip.hotel_name || 'hotel'}
                    price={hotelCost}
                    url={trip.hotel_purchase_url}
                  />
                )}
              </div>

              {/* Skipped items notice */}
              {(flightSkipped || hotelSkipped) && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {flightSkipped && hotelSkipped
                    ? 'flights and hotel were marked as not needed.'
                    : flightSkipped
                    ? 'flights were marked as not needed.'
                    : 'hotel was marked as not needed.'}
                </p>
              )}
            </div>
          </section>

          {/* ================================================================= */}
          {/* Mark as Booked CTA */}
          {/* ================================================================= */}
          <section className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 sm:p-8 text-center">
            {isBooked ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 lowercase">you're all set!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  your trip is booked. we'll send you a reminder as the date approaches. have an amazing time!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
                  <Button variant="outline" asChild>
                    <Link href={`/trip/${tripId}`}>
                      <Share2 className="w-4 h-4 mr-2" />
                      share with friends
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/trips">
                      view all trips
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2 lowercase">finished booking?</h3>
                <p className="text-muted-foreground mb-5 max-w-md mx-auto">
                  once you've completed all your bookings above, mark this trip as booked to track it.
                </p>
                <Button
                  size="lg"
                  onClick={handleMarkBooked}
                  disabled={isMarkingBooked}
                  className="gap-2 px-8 h-12"
                >
                  {isMarkingBooked ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      i booked this trip
                    </>
                  )}
                </Button>
              </>
            )}
          </section>
        </div>

        {/* Bottom spacing for mobile */}
        <div className="h-8" />
      </div>
    </div>
  )
}

// =============================================================================
// Timeline Component
// =============================================================================

interface TimelineProps {
  trip: TripData
  flightSkipped: boolean
  hotelSkipped: boolean
}

function Timeline({ trip, flightSkipped, hotelSkipped }: TimelineProps) {
  const events: TimelineEvent[] = []

  // Departure flight
  if (trip.flight_outbound_date) {
    events.push({
      date: trip.flight_outbound_date,
      time: trip.flight_outbound_time,
      type: 'departure',
      title: 'Depart',
      subtitle: `${trip.flight_origin} → ${trip.flight_destination}`,
      detail: trip.flight_carrier,
      icon: <PlaneTakeoff className="w-4 h-4" />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    })
  }

  // Hotel check-in
  if (trip.hotel_check_in) {
    events.push({
      date: trip.hotel_check_in,
      time: '15:00',
      type: 'hotel-in',
      title: 'Check In',
      subtitle: trip.hotel_name || 'Hotel',
      icon: <Building className="w-4 h-4" />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    })
  }

  // Event
  if (trip.event_date) {
    events.push({
      date: trip.event_date,
      time: trip.event_time,
      type: 'event',
      title: trip.event_name || 'Event',
      subtitle: trip.event_venue,
      detail: trip.event_venue_address,
      icon: <Music className="w-4 h-4" />,
      iconBg: 'bg-primary/10 text-primary',
    })
  }

  // Hotel check-out
  if (trip.hotel_check_out) {
    events.push({
      date: trip.hotel_check_out,
      time: '11:00',
      type: 'hotel-out',
      title: 'Check Out',
      subtitle: trip.hotel_name || 'Hotel',
      icon: <Building className="w-4 h-4" />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    })
  }

  // Return flight
  if (trip.flight_return_date) {
    events.push({
      date: trip.flight_return_date,
      time: trip.flight_return_time,
      type: 'return',
      title: 'Return',
      subtitle: `${trip.flight_destination} → ${trip.flight_origin}`,
      detail: trip.flight_carrier,
      icon: <PlaneLanding className="w-4 h-4" />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    })
  }

  // Sort by date and time
  events.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return (a.time || '00:00').localeCompare(b.time || '00:00')
  })

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No timeline events to display.</p>
        {(flightSkipped || hotelSkipped) && (
          <p className="text-sm mt-1.5">
            {flightSkipped && hotelSkipped
              ? 'Flights and hotel were skipped.'
              : flightSkipped
              ? 'Flights were skipped.'
              : 'Hotel was skipped.'}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[18px] top-5 bottom-5 w-0.5 bg-border" />

      <div className="space-y-5">
        {events.map((event, index) => (
          <TimelineItem key={index} event={event} />
        ))}
      </div>
    </div>
  )
}

interface TimelineEvent {
  date: string
  time?: string | null
  type: 'departure' | 'hotel-in' | 'event' | 'hotel-out' | 'return'
  title: string
  subtitle?: string | null
  detail?: string | null
  icon: React.ReactNode
  iconBg: string
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  return (
    <div className="flex gap-4">
      {/* Icon */}
      <div className={cn('relative z-10 p-2 rounded-full shrink-0', event.iconBg)}>
        {event.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
          <h3 className="font-medium leading-tight">{event.title}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(event.date)}</span>
            {event.time && (
              <>
                <span className="text-muted-foreground/50 mx-0.5">·</span>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{formatTime(event.time)}</span>
              </>
            )}
          </div>
        </div>
        {event.subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{event.subtitle}</p>
        )}
        {event.detail && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{event.detail}</p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Constraint Row
// =============================================================================

function ConstraintRow({ check }: { check: ConstraintCheck }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50">
      <div
        className={cn(
          'p-1 rounded-full shrink-0 mt-0.5',
          check.passed
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
        )}
      >
        {check.passed ? (
          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{check.label}</p>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{check.detail}</p>
      </div>
    </div>
  )
}

// =============================================================================
// Cost Row
// =============================================================================

interface CostRowProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  amount: number
  muted?: boolean
  isLast?: boolean
}

function CostRow({ icon, iconBg, title, subtitle, amount, muted, isLast }: CostRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-4', !isLast && 'border-b')}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('p-2 rounded-lg shrink-0', iconBg)}>{icon}</div>
        <div className="min-w-0">
          <p className="font-medium leading-tight">{title}</p>
          <p className={cn('text-sm leading-snug mt-0.5 truncate', muted ? 'text-muted-foreground/60' : 'text-muted-foreground')}>
            {subtitle}
          </p>
        </div>
      </div>
      <span className={cn('font-semibold tabular-nums shrink-0 ml-4', muted && 'text-muted-foreground/60')}>
        {amount > 0 ? `$${amount.toLocaleString()}` : '—'}
      </span>
    </div>
  )
}

// =============================================================================
// Booking Link Card
// =============================================================================

interface BookingLinkCardProps {
  step: number
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  price: number
  url: string | null
}

function BookingLinkCard({
  step,
  icon,
  iconBg,
  title,
  subtitle,
  price,
  url,
}: BookingLinkCardProps) {
  const hasUrl = !!url

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-all',
        hasUrl
          ? 'hover:bg-muted/50 hover:border-primary/30 cursor-pointer'
          : 'opacity-60'
      )}
    >
      {/* Step number */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
        {step}
      </div>

      {/* Icon */}
      <div className={cn('p-2 rounded-lg shrink-0 hidden sm:flex', iconBg)}>{icon}</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-tight">{title}</p>
        <p className="text-sm text-muted-foreground truncate leading-snug mt-0.5">{subtitle}</p>
      </div>

      {/* Price & Arrow */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {price > 0 && (
          <span className="font-semibold tabular-nums text-sm sm:text-base">${price.toLocaleString()}</span>
        )}
        {hasUrl ? (
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground hidden sm:inline">No link</span>
        )}
      </div>
    </div>
  )

  if (hasUrl) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return content
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toLowerCase()
}

function formatTime(timeString: string): string {
  // Handle both "HH:MM" and "HH:MM:SS" formats
  const [hours, minutes] = timeString.split(':')
  const h = parseInt(hours, 10)
  const suffix = h >= 12 ? 'pm' : 'am'
  const displayHour = h % 12 || 12
  return `${displayHour}:${minutes}${suffix}`
}

function buildConstraintChecks(
  trip: TripData,
  flightSkipped: boolean,
  hotelSkipped: boolean
): ConstraintCheck[] {
  const checks: ConstraintCheck[] = []

  // Event exists
  checks.push({
    label: 'Event selected',
    passed: !!trip.event_name,
    detail: trip.event_name || 'No event selected',
  })

  // Flight timing check
  if (!flightSkipped && trip.flight_outbound_date && trip.event_date) {
    const flightDate = new Date(trip.flight_outbound_date + 'T00:00:00')
    const eventDate = new Date(trip.event_date + 'T00:00:00')
    const daysBefore = Math.floor((eventDate.getTime() - flightDate.getTime()) / (1000 * 60 * 60 * 24))

    checks.push({
      label: 'Arrival timing',
      passed: daysBefore >= 0,
      detail:
        daysBefore >= 0
          ? `Arriving ${daysBefore === 0 ? 'same day' : daysBefore === 1 ? '1 day before' : `${daysBefore} days before`} event`
          : 'Flight departs after event date',
    })
  } else if (flightSkipped) {
    checks.push({
      label: 'Flights',
      passed: true,
      detail: 'Marked as not needed',
    })
  }

  // Return flight timing
  if (!flightSkipped && trip.flight_return_date && trip.event_date) {
    const returnDate = new Date(trip.flight_return_date + 'T00:00:00')
    const eventDate = new Date(trip.event_date + 'T00:00:00')
    const daysAfter = Math.floor((returnDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))

    checks.push({
      label: 'Return timing',
      passed: daysAfter >= 0,
      detail:
        daysAfter >= 0
          ? `Returning ${daysAfter === 0 ? 'same day' : daysAfter === 1 ? '1 day after' : `${daysAfter} days after`} event`
          : 'Return flight before event date',
    })
  }

  // Hotel check-in timing
  if (!hotelSkipped && trip.hotel_check_in && trip.event_date) {
    const checkInDate = new Date(trip.hotel_check_in + 'T00:00:00')
    const eventDate = new Date(trip.event_date + 'T00:00:00')
    const daysBefore = Math.floor((eventDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    checks.push({
      label: 'Hotel check-in',
      passed: daysBefore >= 0,
      detail:
        daysBefore >= 0
          ? `Checking in ${daysBefore === 0 ? 'event day' : daysBefore === 1 ? '1 day before' : `${daysBefore} days before`}`
          : 'Check-in after event date',
    })
  } else if (hotelSkipped) {
    checks.push({
      label: 'Hotel',
      passed: true,
      detail: 'Marked as not needed',
    })
  }

  // Hotel check-out timing
  if (!hotelSkipped && trip.hotel_check_out && trip.event_date) {
    const checkOutDate = new Date(trip.hotel_check_out + 'T00:00:00')
    const eventDate = new Date(trip.event_date + 'T00:00:00')
    const daysAfter = Math.floor((checkOutDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))

    checks.push({
      label: 'Hotel check-out',
      passed: daysAfter >= 0,
      detail:
        daysAfter >= 0
          ? `Checking out ${daysAfter === 0 ? 'event day' : daysAfter === 1 ? '1 day after' : `${daysAfter} days after`}`
          : 'Check-out before event',
    })
  }

  // Price estimate available
  const hasPricing = (trip.event_price_estimate || 0) + (trip.flight_price || 0) + (trip.hotel_price || 0) > 0
  checks.push({
    label: 'Cost estimate',
    passed: hasPricing,
    detail: hasPricing ? 'Pricing available' : 'No pricing info',
  })

  return checks
}
