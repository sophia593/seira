'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  Plane,
  Hotel,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Ticket,
  User,
  Copy,
  Check,
  ArrowRight,
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
      router.push(`/trip/${result.id}`)
    } catch (error: unknown) {
      console.error('Failed to duplicate trip:', error)
      const status = (error as { status?: number })?.status
      if (status === 401) {
        // Not authenticated - redirect to login with return URL
        const returnUrl = `/shared/${token}?action=duplicate`
        router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
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
      if (urlParams.get('action') === 'duplicate' && trip) {
        // Clear the action param and trigger duplicate
        window.history.replaceState({}, '', `/shared/${token}`)
        handleDuplicate()
      }
    }
  }, [trip, token])

  // ===========================================================================
  // Loading State
  // ===========================================================================

  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
  // Ready State - Shared Trip View
  // ===========================================================================

  const hasEvent = !!trip.event_name
  const hasFlight = !!trip.flight_origin
  const hasHotel = !!trip.hotel_name

  // Calculate estimated total
  const estimatedTotal = trip.estimated_total || [
    trip.event_price_estimate,
    trip.flight_price,
    trip.hotel_price,
  ].filter((p): p is number => p !== null && p !== undefined).reduce((sum, price) => sum + price, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold">
              seira
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">shared trip</span>
          </div>

          <Button
            onClick={handleDuplicate}
            disabled={isDuplicating}
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

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Shared by banner */}
        {trip.shared_by_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <User className="w-4 h-4" />
            shared by <span className="font-medium text-foreground">{trip.shared_by_name}</span>
          </div>
        )}

        {/* Trip title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 lowercase">{trip.title}</h1>

        {/* Timeline View */}
        <div className="space-y-4">
          {/* Event Card */}
          {hasEvent && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                    <Ticket className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg mb-1">{trip.event_name}</h2>
                    {trip.event_venue && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{trip.event_venue}</span>
                      </div>
                    )}
                    {(trip.event_date || trip.event_time) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          {trip.event_date && formatDate(trip.event_date)}
                          {trip.event_time && ` at ${trip.event_time}`}
                        </span>
                      </div>
                    )}
                    {trip.event_price_estimate && (
                      <p className="text-sm font-medium text-primary mt-2">
                        ~${trip.event_price_estimate.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flight Card */}
          {hasFlight && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
                    <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg mb-2">
                      {trip.flight_origin} → {trip.flight_destination}
                    </h2>
                    {trip.flight_carrier && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {trip.flight_carrier}
                      </p>
                    )}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {trip.flight_outbound_date && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Depart:</span>
                          {formatDate(trip.flight_outbound_date)}
                          {trip.flight_outbound_time && ` at ${trip.flight_outbound_time}`}
                        </div>
                      )}
                      {trip.flight_return_date && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Return:</span>
                          {formatDate(trip.flight_return_date)}
                          {trip.flight_return_time && ` at ${trip.flight_return_time}`}
                        </div>
                      )}
                    </div>
                    {trip.flight_price && (
                      <p className="text-sm font-medium text-primary mt-2">
                        ${trip.flight_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hotel Card */}
          {hasHotel && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
                    <Hotel className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg mb-2">{trip.hotel_name}</h2>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {trip.hotel_check_in && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Check-in:</span>
                          {formatDate(trip.hotel_check_in)}
                        </div>
                      )}
                      {trip.hotel_check_out && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Check-out:</span>
                          {formatDate(trip.hotel_check_out)}
                        </div>
                      )}
                    </div>
                    {trip.hotel_price && (
                      <p className="text-sm font-medium text-primary mt-2">
                        ${trip.hotel_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total Cost Card */}
          {estimatedTotal > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold">estimated total</h2>
                      <p className="text-sm text-muted-foreground">
                        prices may vary at time of booking
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">${estimatedTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 p-6 rounded-xl border bg-card text-center">
          <h3 className="font-semibold mb-2">want to plan a trip like this?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            save this trip to your account or start planning your own
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
              <Link href="/">
                start a new trip
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            seira
          </Link>
          {' · '}
          <span>ai-powered trip planning</span>
        </div>
      </footer>
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
    year: 'numeric',
  }).toLowerCase()
}
