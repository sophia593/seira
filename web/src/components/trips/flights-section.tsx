'use client'

import { useState } from 'react'
import { Plane, RefreshCw, AlertTriangle } from 'lucide-react'
import { FlightDetailCard } from './flight-detail-card'
import { Button } from '@/components/ui/button'

interface TripFlight {
  id: string
  direction: 'outbound' | 'return'
  airline_name: string
  airline_code: string
  airline_logo_url?: string | null
  flight_number: string
  origin_code: string
  origin_city: string
  origin_timezone?: string
  destination_code: string
  destination_city: string
  destination_timezone?: string
  departure_time: string
  arrival_time: string
  duration_minutes: number
  stops: number
  stop_details?: Array<{
    airport_code: string
    airport_city: string
    layover_minutes: number
  }>
  cabin_class?: string
  price_per_person: number
  currency?: string
  booking_url: string
}

interface BookingClick {
  id: string
  click_type: 'outbound_flight' | 'return_flight'
  purchase_confirmed: boolean
  confirmed_at?: string | null
}

interface FlightsSectionProps {
  outboundFlight?: TripFlight | null
  returnFlight?: TripFlight | null
  travelers: number
  pricesFetchedAt?: string | null
  bookingClicks?: BookingClick[]
  onRefreshQuotes?: () => Promise<void>
  onBookClick?: (clickType: 'outbound_flight' | 'return_flight') => void
}

// Staleness threshold: 1 hour
const STALENESS_THRESHOLD_MS = 60 * 60 * 1000

export function FlightsSection({
  outboundFlight,
  returnFlight,
  travelers,
  pricesFetchedAt,
  bookingClicks = [],
  onRefreshQuotes,
  onBookClick,
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

  // Check purchase status
  const outboundPurchased = bookingClicks.find(
    c => c.click_type === 'outbound_flight' && c.purchase_confirmed
  )
  const returnPurchased = bookingClicks.find(
    c => c.click_type === 'return_flight' && c.purchase_confirmed
  )

  const handleRefresh = async () => {
    if (!onRefreshQuotes) return

    setIsRefreshing(true)
    setRefreshError(null)

    try {
      await onRefreshQuotes()
    } catch {
      setRefreshError('couldn\'t refresh prices. try again.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOutboundBook = () => {
    onBookClick?.('outbound_flight')
  }

  const handleReturnBook = () => {
    onBookClick?.('return_flight')
  }

  if (!outboundFlight && !returnFlight) {
    return null
  }

  return (
    <div className="space-y-4">
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

      {/* Flight cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {outboundFlight && (
          <FlightDetailCard
            flight={outboundFlight}
            travelers={travelers}
            isPurchased={!!outboundPurchased}
            purchasedAt={outboundPurchased?.confirmed_at}
            onBookClick={handleOutboundBook}
          />
        )}

        {returnFlight && (
          <FlightDetailCard
            flight={returnFlight}
            travelers={travelers}
            isPurchased={!!returnPurchased}
            purchasedAt={returnPurchased?.confirmed_at}
            onBookClick={handleReturnBook}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Format relative time: "2025-03-15T08:30:00" → "2 hours ago"
 */
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
