'use client'

import { useState } from 'react'
import {
  Plane,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  PlaneTakeoff,
  PlaneLanding,
} from 'lucide-react'
import { FlightDetailCard } from './flight-detail-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type TripFlightData, isRichFlight } from '@/types/trip'

// =============================================================================
// Types
// =============================================================================

interface FlightsSectionProps {
  outboundFlight?: TripFlightData | null
  returnFlight?: TripFlightData | null
  travelers?: number
  pricesFetchedAt?: string | null
  onRefreshQuotes?: () => Promise<void>
  onBookClick?: (direction: 'outbound' | 'return') => void
  className?: string
}

// Staleness threshold: 1 hour
const STALENESS_THRESHOLD_MS = 60 * 60 * 1000

// =============================================================================
// Main Component
// =============================================================================

/**
 * Flights section that works with both:
 * - Flat TripDetail flight fields (current API)
 * - Rich TripFlight objects (future API)
 */
export function FlightsSection({
  outboundFlight,
  returnFlight,
  travelers = 1,
  pricesFetchedAt,
  onRefreshQuotes,
  onBookClick,
  className,
}: FlightsSectionProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  // Check if prices are stale
  const isStale = pricesFetchedAt
    ? Date.now() - new Date(pricesFetchedAt).getTime() > STALENESS_THRESHOLD_MS
    : false

  // Format last fetched time
  const lastFetchedText = pricesFetchedAt
    ? formatRelativeTime(pricesFetchedAt)
    : null

  const handleRefresh = async () => {
    if (!onRefreshQuotes) return

    setIsRefreshing(true)
    setRefreshError(null)

    try {
      await onRefreshQuotes()
    } catch {
      setRefreshError("couldn't refresh prices. try again.")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!outboundFlight && !returnFlight) {
    return null
  }

  // Determine if we have rich or flat data
  const hasRichData = (outboundFlight && isRichFlight(outboundFlight)) ||
    (returnFlight && isRichFlight(returnFlight))

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5" />
          <h2 className="text-lg font-semibold lowercase">flights</h2>
        </div>

        {onRefreshQuotes && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="lowercase"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                refresh quotes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Staleness warning */}
      {isStale && !isRefreshing && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-800 dark:text-amber-200">
              prices last checked {lastFetchedText}. prices may have changed.
            </p>
          </div>
        </div>
      )}

      {/* Refresh error */}
      {refreshError && (
        <div className="text-sm text-destructive p-3 rounded-lg bg-destructive/10">
          {refreshError}
        </div>
      )}

      {/* Flight cards - use rich or simple based on data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {outboundFlight && (
          hasRichData && isRichFlight(outboundFlight) ? (
            <FlightDetailCard
              flight={outboundFlight}
              travelers={travelers}
              onBookClick={() => onBookClick?.('outbound')}
            />
          ) : (
            <FlightCardSimple
              flight={outboundFlight}
              onBookClick={() => onBookClick?.('outbound')}
            />
          )
        )}

        {returnFlight && (
          hasRichData && isRichFlight(returnFlight) ? (
            <FlightDetailCard
              flight={returnFlight}
              travelers={travelers}
              onBookClick={() => onBookClick?.('return')}
            />
          ) : (
            <FlightCardSimple
              flight={returnFlight}
              onBookClick={() => onBookClick?.('return')}
            />
          )
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Simple Flight Card (for flat data)
// =============================================================================

interface FlightCardSimpleProps {
  flight: TripFlightData
  onBookClick?: () => void
}

function FlightCardSimple({ flight, onBookClick }: FlightCardSimpleProps) {
  // This handles flat data format
  if (isRichFlight(flight)) {
    return null // Should use FlightDetailCard instead
  }

  const { direction, origin, destination, date, time, carrier, price, purchase_url } = flight

  if (!origin || !destination) {
    return null
  }

  const formattedDate = date ? formatShortDate(date) : null
  const Icon = direction === 'outbound' ? PlaneTakeoff : PlaneLanding

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-sm font-medium lowercase px-2 py-0.5 rounded-full bg-muted">
            {direction}
          </span>
          {carrier && (
            <p className="text-xs text-muted-foreground mt-1">{carrier}</p>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
        <Plane className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{origin}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium">{destination}</span>
          </div>
          {formattedDate && (
            <p className="text-xs text-muted-foreground">
              {formattedDate}
              {time && ` · ${time}`}
            </p>
          )}
        </div>
      </div>

      {/* Price & Book */}
      <div className="flex items-center justify-between">
        {price && (
          <p className="font-semibold">${price}</p>
        )}
        {purchase_url && (
          <Button
            asChild
            size="sm"
            variant={price ? 'outline' : 'default'}
            className="lowercase"
            onClick={onBookClick}
          >
            <a href={purchase_url} target="_blank" rel="noopener noreferrer">
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
// Helper Functions
// =============================================================================

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  return `${days} day${days === 1 ? '' : 's'} ago`
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
