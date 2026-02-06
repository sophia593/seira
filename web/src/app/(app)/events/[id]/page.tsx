'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Ticket,
  ExternalLink,
  Clock,
  Plane,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { toast } from '@/components/ui/sonner'
import { getApi } from '@/lib/api'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface EventData {
  id: string
  name: string
  date: string
  time: string | null
  venue: {
    name: string
    city: string | null
    state: string | null
    address: string | null
  } | null
  image_url: string | null
  price_range: { min: number | null; max: number | null } | null
  purchase_url: string
  genre: string | null
  segment: string | null
  provider: string
  provider_id: string
}

type LoadingState = 'loading' | 'not-found' | 'error' | 'ready'

// =============================================================================
// Page
// =============================================================================

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [originAirport, setOriginAirport] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      try {
        const api = getApi()
        // The event ID may have 'tm_' prefix, strip it for the API call
        const providerId = eventId.startsWith('tm_') ? eventId.slice(3) : eventId
        const response = await api.get<EventData>(`/api/v1/events/${providerId}`)
        setEvent(response)
        setLoadingState('ready')
      } catch (error: unknown) {
        console.error('Failed to fetch event:', error)
        const status = (error as { status?: number })?.status
        if (status === 404) {
          setLoadingState('not-found')
        } else {
          setLoadingState('error')
        }
      }
    }

    fetchEvent()
  }, [eventId])

  // Handle plan creation
  async function handleStartPlan() {
    if (!event) return

    const airport = originAirport.trim().toUpperCase()
    if (!airport || airport.length < 3) {
      toast.error('enter your departure airport code (e.g., LAX, JFK)')
      return
    }

    setIsCreating(true)
    try {
      const api = getApi()
      const trip = await api.createTrip({
        title: event.name,
        destination_city: event.venue?.city || undefined,
        event_name: event.name,
        event_date: event.date,
        event_time: event.time || undefined,
        event_venue: event.venue?.name || undefined,
        event_venue_address: event.venue?.address || undefined,
        event_price_estimate: event.price_range?.min || undefined,
        event_purchase_url: event.purchase_url || undefined,
        event_image_url: event.image_url || undefined,
        event_provider: event.provider,
        event_provider_id: event.provider_id,
        event_ticketmaster_id: event.provider === 'ticketmaster' ? event.provider_id : undefined,
        origin_airport_code: airport,
      })

      toast.success('plan created')
      router.push(`/plan/${trip.id}`)
    } catch (error) {
      console.error('Failed to create plan:', error)
      toast.error('failed to create plan')
    } finally {
      setIsCreating(false)
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
  // Not Found
  // ===========================================================================

  if (loadingState === 'not-found') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-semibold mb-2 lowercase">event not found</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          this event may have been removed or the link is invalid.
        </p>
        <Link href="/events" className="text-sm text-primary hover:underline lowercase">
          &larr; back to events
        </Link>
      </div>
    )
  }

  // ===========================================================================
  // Error
  // ===========================================================================

  if (loadingState === 'error' || !event) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-semibold mb-2 lowercase">something went wrong</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          couldn't load this event. please try again.
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
  // Ready State
  // ===========================================================================

  const venueDisplay = event.venue
    ? [event.venue.name, event.venue.city, event.venue.state].filter(Boolean).join(', ')
    : null
  const priceDisplay = event.price_range?.min
    ? event.price_range.max && event.price_range.max !== event.price_range.min
      ? `$${Math.round(event.price_range.min)} – $${Math.round(event.price_range.max)}`
      : `$${Math.round(event.price_range.min)}+`
    : null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          back to events
        </Link>

        {/* Event Image */}
        {event.image_url ? (
          <div className="aspect-video rounded-2xl overflow-hidden bg-muted relative mb-6">
            <OptimizedImage src={event.image_url} alt={event.name} fill priority />
          </div>
        ) : (
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
            <Calendar className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Event Name */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 lowercase">{event.name}</h1>

        {/* Category badges */}
        {(event.genre || event.segment) && (
          <div className="flex gap-2 mb-6">
            {event.segment && (
              <span className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                {event.segment}
              </span>
            )}
            {event.genre && event.genre !== event.segment && (
              <span className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                {event.genre}
              </span>
            )}
          </div>
        )}

        {/* Details */}
        <div className="space-y-4 mb-8">
          {/* Date/Time */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{formatDate(event.date)}</p>
              {event.time && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4" />
                  {formatTime(event.time)}
                </p>
              )}
            </div>
          </div>

          {/* Venue */}
          {venueDisplay && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{event.venue?.name}</p>
                {(event.venue?.city || event.venue?.state) && (
                  <p className="text-sm text-muted-foreground">
                    {[event.venue?.city, event.venue?.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          {priceDisplay && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Ticket className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{priceDisplay}</p>
                <p className="text-sm text-muted-foreground">estimated ticket price</p>
              </div>
            </div>
          )}
        </div>

        {/* External link */}
        {event.purchase_url && event.purchase_url !== '#' && (
          <a
            href={event.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ExternalLink className="w-4 h-4" />
            View on Ticketmaster
          </a>
        )}

        {/* Divider */}
        <hr className="mb-8" />

        {/* Origin Input + Start Planning */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 lowercase">plan your trip</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="origin" className="text-sm font-medium mb-2 block">
                where are you flying from?
              </Label>
              <div className="relative">
                <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="origin"
                  placeholder="airport code (e.g., LAX, JFK, ORD)"
                  value={originAirport}
                  onChange={(e) => setOriginAirport(e.target.value.toUpperCase())}
                  className="pl-10 uppercase"
                  maxLength={4}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                enter your departure airport code
              </p>
            </div>

            <Button
              onClick={handleStartPlan}
              disabled={isCreating || !originAirport.trim()}
              className="w-full h-11"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  creating plan...
                </>
              ) : (
                'start planning'
              )}
            </Button>
          </div>
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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
