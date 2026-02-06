'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  Plane,
  Hotel,
  Calendar,
  Clock,
  DollarSign,
  Ticket,
  User,
  Copy,
  ArrowRight,
  ExternalLink,
  PlaneTakeoff,
  PlaneLanding,
  Building,
  Music,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getApi } from '@/lib/api'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import type { SharedTrip } from '@/lib/api/client'

type LoadingState = 'loading' | 'not-found' | 'error' | 'ready'

export default function SharedTripPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [trip, setTrip] = useState<SharedTrip | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [isDuplicating, setIsDuplicating] = useState(false)

  useEffect(() => {
    async function fetchSharedTrip() {
      try {
        const api = getApi()
        const data = await api.getSharedTrip(token)
        setTrip(data)
        setLoadingState('ready')
      } catch (error: unknown) {
        console.error('Failed to fetch shared trip:', error)
        const status = (error as { status?: number })?.status
        if (status === 404) {
          setLoadingState('not-found')
        } else {
          setLoadingState('error')
        }
      }
    }

    fetchSharedTrip()
  }, [token])

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const api = getApi()
      const result = await api.duplicateSharedTrip(token)
      toast.success('trip saved to your account')
      router.push(`/plan/${result.id}`)
    } catch (error: unknown) {
      console.error('Failed to duplicate trip:', error)
      const status = (error as { status?: number })?.status
      if (status === 401) {
        toast('sign in to save this trip', {
          description: "we'll save it to your account automatically after you log in.",
        })
        const returnUrl = `/shared/${token}?action=duplicate`
        // Brief delay so the toast is visible before navigation
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
        }, 1200)
      } else {
        toast.error('failed to save trip')
      }
    } finally {
      setIsDuplicating(false)
    }
  }

  // Handle duplicate action after login redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('action') === 'duplicate' && trip && !isDuplicating) {
        window.history.replaceState({}, '', `/shared/${token}`)
        handleDuplicate()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, token])

  // ===========================================================================
  // Loading State
  // ===========================================================================

  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-14 bg-muted rounded animate-pulse" />
              <span className="text-muted-foreground">·</span>
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-36 bg-muted rounded-lg animate-pulse" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
          <div className="h-4 w-40 bg-muted rounded animate-pulse mb-4" />
          <div className="h-8 w-3/4 bg-muted rounded animate-pulse mb-8" />

          {/* Timeline skeleton */}
          <div className="rounded-2xl border bg-card p-6 mb-6 animate-pulse">
            <div className="h-5 w-28 bg-muted rounded mb-4" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost skeleton */}
          <div className="rounded-2xl border bg-card p-6 animate-pulse">
            <div className="h-5 w-28 bg-muted rounded mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ===========================================================================
  // Not Found State
  // ===========================================================================

  if (loadingState === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
        <h1 className="text-xl font-semibold mb-2 lowercase">trip not found</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          this shared link may have expired or been removed
        </p>
        <Link
          href="/"
          className="text-sm text-primary hover:underline lowercase"
        >
          ← go to homepage
        </Link>
      </div>
    )
  }

  // ===========================================================================
  // Error State
  // ===========================================================================

  if (loadingState === 'error' || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
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
  // Ready State - Receipt-style shared trip view
  // ===========================================================================

  const hasEvent = !!trip.event_name
  const hasFlight = !!trip.flight_origin
  const hasHotel = !!trip.hotel_name

  const ticketCost = trip.event_price_estimate || 0
  const flightCost = trip.flight_price || 0
  const hotelCost = trip.hotel_price || 0
  const totalCost = trip.estimated_total || (ticketCost + flightCost + hotelCost)

  // Build timeline events
  const timelineEvents = buildTimeline(trip)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold">
              seira
            </Link>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-sm text-muted-foreground">shared trip</span>
          </div>

          <Button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            size="sm"
            className="gap-2"
          >
            {isDuplicating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                saving...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                save to my trips
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Shared by banner */}
        {trip.shared_by_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <User className="w-4 h-4" />
            shared by <span className="font-medium text-foreground">{trip.shared_by_name}</span>
          </div>
        )}

        {/* Trip title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 lowercase">{trip.title}</h1>
        {trip.destination_city && (
          <p className="text-muted-foreground text-lg mb-8">{trip.destination_city}</p>
        )}

        <div className="space-y-6">
          {/* ================================================================= */}
          {/* Timeline */}
          {/* ================================================================= */}
          {timelineEvents.length > 0 && (
            <section className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30">
                <h2 className="font-semibold flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  trip timeline
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[18px] top-5 bottom-5 w-0.5 bg-border" />

                  <div className="space-y-5">
                    {timelineEvents.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className={cn('relative z-10 p-2 rounded-full shrink-0', event.iconBg)}>
                          {event.icon}
                        </div>
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
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

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
                {hasEvent && (
                  <CostRow
                    icon={<Ticket className="w-4 h-4" />}
                    iconBg="bg-primary/10 text-primary"
                    title="event tickets"
                    subtitle={trip.event_name || 'event'}
                    amount={ticketCost}
                  />
                )}

                {/* Flights */}
                <CostRow
                  icon={<Plane className="w-4 h-4" />}
                  iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  title="flights"
                  subtitle={
                    hasFlight
                      ? `${trip.flight_origin} → ${trip.flight_destination}`
                      : 'not included'
                  }
                  amount={flightCost}
                  muted={!hasFlight}
                />

                {/* Hotel */}
                <CostRow
                  icon={<Hotel className="w-4 h-4" />}
                  iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  title="hotel"
                  subtitle={
                    hasHotel
                      ? trip.hotel_name || 'hotel'
                      : 'not included'
                  }
                  amount={hotelCost}
                  muted={!hasHotel}
                  isLast
                />

                {/* Total */}
                <div className="flex items-center justify-between pt-5 mt-1 border-t">
                  <span className="text-lg font-semibold">estimated total</span>
                  <span className="text-2xl sm:text-3xl font-bold text-primary">
                    {totalCost > 0 ? `$${totalCost.toLocaleString()}` : '—'}
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
          {(trip.event_purchase_url || hasFlight || hasHotel) && (
            <section className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30">
                <h2 className="font-semibold flex items-center gap-2.5">
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  booking links
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                <div className="space-y-3">
                  {trip.event_purchase_url && trip.event_purchase_url !== '#' && (
                    <BookingLink
                      step={1}
                      icon={<Ticket className="w-5 h-5" />}
                      iconBg="bg-primary/10 text-primary"
                      title="event tickets"
                      subtitle={trip.event_name || 'event'}
                      url={trip.event_purchase_url}
                    />
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================================================================= */}
          {/* Save CTA */}
          {/* ================================================================= */}
          <section className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 sm:p-8 text-center">
            <h3 className="text-xl font-semibold mb-2 lowercase">want to plan a trip like this?</h3>
            <p className="text-muted-foreground mb-5 max-w-md mx-auto">
              save this trip to your account and customize it, or start a new one from scratch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleDuplicate} disabled={isDuplicating} className="gap-2">
                {isDuplicating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    saving...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    save this trip
                  </>
                )}
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/events">
                  start a new trip
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </section>
        </div>

        {/* Bottom spacing */}
        <div className="h-8" />
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            seira
          </Link>
          {' · '}
          <span>plan trips to live events</span>
        </div>
      </footer>
    </div>
  )
}

// =============================================================================
// Timeline Builder
// =============================================================================

interface TimelineEvent {
  date: string
  time?: string | null
  title: string
  subtitle?: string | null
  detail?: string | null
  icon: React.ReactNode
  iconBg: string
}

function buildTimeline(trip: SharedTrip): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Departure flight
  if (trip.flight_outbound_date) {
    events.push({
      date: trip.flight_outbound_date,
      time: trip.flight_outbound_time,
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
      title: 'Return',
      subtitle: `${trip.flight_destination} → ${trip.flight_origin}`,
      detail: trip.flight_carrier,
      icon: <PlaneLanding className="w-4 h-4" />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    })
  }

  // Sort chronologically
  events.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return (a.time || '00:00').localeCompare(b.time || '00:00')
  })

  return events
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
// Booking Link
// =============================================================================

interface BookingLinkProps {
  step: number
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  url: string
}

function BookingLink({ step, icon, iconBg, title, subtitle, url }: BookingLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl border hover:bg-muted/50 hover:border-primary/30 transition-all"
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
        {step}
      </div>
      <div className={cn('p-2 rounded-lg shrink-0 hidden sm:flex', iconBg)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-tight">{title}</p>
        <p className="text-sm text-muted-foreground truncate leading-snug mt-0.5">{subtitle}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
    </a>
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

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const h = parseInt(hours, 10)
  const suffix = h >= 12 ? 'pm' : 'am'
  const displayHour = h % 12 || 12
  return `${displayHour}:${minutes}${suffix}`
}
