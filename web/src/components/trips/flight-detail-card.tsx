'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plane,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FlightStop {
  airport_code: string
  airport_city: string
  layover_minutes: number
}

interface TripFlight {
  id: string
  direction: 'outbound' | 'return'

  // Airline
  airline_name: string
  airline_code: string
  airline_logo_url?: string | null
  flight_number: string

  // Route
  origin_code: string
  origin_city: string
  origin_timezone?: string
  destination_code: string
  destination_city: string
  destination_timezone?: string

  // Times
  departure_time: string
  arrival_time: string

  // Duration & stops
  duration_minutes: number
  stops: number
  stop_details?: FlightStop[]

  // Class & price
  cabin_class?: string
  price_per_person: number
  currency?: string

  // Booking
  booking_url: string
}

interface FlightDetailCardProps {
  flight: TripFlight
  travelers: number
  isPurchased?: boolean
  purchasedAt?: string | null
  onBookClick?: () => void
  className?: string
}

export function FlightDetailCard({
  flight,
  travelers,
  isPurchased = false,
  purchasedAt,
  onBookClick,
  className,
}: FlightDetailCardProps) {
  const [isStopsExpanded, setIsStopsExpanded] = useState(false)

  const {
    direction,
    airline_name,
    airline_code,
    airline_logo_url,
    flight_number,
    origin_code,
    origin_city,
    origin_timezone,
    destination_code,
    destination_city,
    destination_timezone,
    departure_time,
    arrival_time,
    duration_minutes,
    stops,
    stop_details,
    cabin_class,
    price_per_person,
    booking_url,
  } = flight

  // Formatting
  const departureFormatted = formatFlightTime(departure_time)
  const arrivalFormatted = formatFlightTime(arrival_time)
  const durationFormatted = formatDuration(duration_minutes)
  const dateFormatted = formatFlightDate(departure_time)
  const totalPrice = price_per_person * travelers

  const handleBookClick = () => {
    onBookClick?.()
    // Link will open via the anchor tag
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-5">
        {/* Header: Direction + Date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium lowercase px-2 py-0.5 rounded-full bg-muted">
              {direction}
            </span>
            <span className="text-sm text-muted-foreground">{dateFormatted}</span>
          </div>

          {/* Purchase status */}
          {isPurchased && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">purchased</span>
            </div>
          )}
        </div>

        {/* Airline row */}
        <div className="flex items-center gap-3 mb-4">
          <AirlineBadge
            code={airline_code}
            name={airline_name}
            logoUrl={airline_logo_url}
          />
          <div>
            <p className="font-medium lowercase">{airline_name}</p>
            <p className="text-sm text-muted-foreground">{airline_code} {flight_number}</p>
          </div>
        </div>

        {/* Route visualization */}
        <div className="mb-4">
          <RouteVisualization
            originCode={origin_code}
            destinationCode={destination_code}
            stops={stops}
            stopDetails={stop_details}
          />
        </div>

        {/* Times row */}
        <div className="flex items-start justify-between mb-4">
          {/* Departure */}
          <div className="text-left">
            <p className="text-xl font-semibold">{departureFormatted}</p>
            <p className="text-sm text-muted-foreground">
              {origin_code} {origin_timezone && `· ${origin_timezone}`}
            </p>
            <p className="text-sm text-muted-foreground lowercase">{origin_city}</p>
          </div>

          {/* Duration & stops */}
          <div className="text-center flex-1 px-4">
            <p className="text-sm font-medium">{durationFormatted}</p>
            <StopsIndicator
              stops={stops}
              stopDetails={stop_details}
              isExpanded={isStopsExpanded}
              onToggle={() => setIsStopsExpanded(!isStopsExpanded)}
            />
          </div>

          {/* Arrival */}
          <div className="text-right">
            <p className="text-xl font-semibold">{arrivalFormatted}</p>
            <p className="text-sm text-muted-foreground">
              {destination_timezone && `${destination_timezone} · `}{destination_code}
            </p>
            <p className="text-sm text-muted-foreground lowercase">{destination_city}</p>
          </div>
        </div>

        {/* Expanded stops */}
        {isStopsExpanded && stop_details && stop_details.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2 lowercase">layover details</p>
            {stop_details.map((stop, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="lowercase">{stop.airport_city} ({stop.airport_code})</span>
                <span className="text-muted-foreground">{formatDuration(stop.layover_minutes)} layover</span>
              </div>
            ))}
          </div>
        )}

        {/* Price breakdown */}
        <div className="p-3 rounded-lg bg-muted/50 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground lowercase">
                {cabin_class || 'economy'} · {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${totalPrice}</p>
              {travelers > 1 && (
                <p className="text-xs text-muted-foreground">
                  ${price_per_person}/person × {travelers}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action */}
        {isPurchased ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              purchased {purchasedAt && `on ${formatPurchaseDate(purchasedAt)}`}
            </p>
          </div>
        ) : (
          <Button asChild className="w-full lowercase" onClick={handleBookClick}>
            <a
              href={booking_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              book flight
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  )
}

/**
 * Airline logo or code badge (same as FlightCard)
 */
function AirlineBadge({
  code,
  name,
  logoUrl,
}: {
  code: string
  name: string
  logoUrl?: string | null
}) {
  if (logoUrl) {
    return (
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  return (
    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
      <span className="text-sm font-bold text-muted-foreground">{code}</span>
    </div>
  )
}

/**
 * Route visualization (same as FlightCard)
 */
function RouteVisualization({
  originCode,
  destinationCode,
  stops,
  stopDetails,
}: {
  originCode: string
  destinationCode: string
  stops: number
  stopDetails?: FlightStop[]
}) {
  return (
    <div className="relative flex items-center py-2">
      {/* Origin dot */}
      <div className="flex flex-col items-center z-10">
        <div className="w-3 h-3 rounded-full bg-foreground" />
      </div>

      {/* Line with stops */}
      <div className="flex-1 relative mx-2">
        <div className="h-0.5 bg-border w-full absolute top-1/2 -translate-y-1/2" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-1">
          <Plane className="w-4 h-4 text-muted-foreground" />
        </div>

        {stops > 0 && stopDetails && (
          <div className="absolute inset-0 flex items-center justify-around px-8">
            {stopDetails.map((stop, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-muted-foreground border-2 border-card z-10"
                title={`${stop.airport_city} (${stop.airport_code})`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Destination dot */}
      <div className="flex flex-col items-center z-10">
        <div className="w-3 h-3 rounded-full bg-foreground" />
      </div>
    </div>
  )
}

/**
 * Stops indicator (same as FlightCard)
 */
function StopsIndicator({
  stops,
  stopDetails,
  isExpanded,
  onToggle,
}: {
  stops: number
  stopDetails?: FlightStop[]
  isExpanded: boolean
  onToggle: () => void
}) {
  if (stops === 0) {
    return (
      <span className="text-xs font-medium text-green-600 dark:text-green-500">
        nonstop
      </span>
    )
  }

  const hasDetails = stopDetails && stopDetails.length > 0
  const stopsText = stops === 1 ? '1 stop' : `${stops} stops`

  if (!hasDetails) {
    return (
      <span className="text-xs text-muted-foreground">{stopsText}</span>
    )
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-0.5 text-xs',
        'text-muted-foreground hover:text-foreground transition-colors',
        stops >= 2 && 'text-amber-600 dark:text-amber-500'
      )}
    >
      {stopsText}
      {isExpanded ? (
        <ChevronUp className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3" />
      )}
    </button>
  )
}

/**
 * Format time: "2025-03-15T08:30:00" → "8:30 am"
 */
function formatFlightTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase()
}

/**
 * Format date: "2025-03-15T08:30:00" → "saturday, march 15"
 */
function formatFlightDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toLowerCase()
}

/**
 * Format duration: 375 → "6h 15m"
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format purchase date: "2025-03-10T14:30:00" → "march 10, 2025"
 */
function formatPurchaseDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toLowerCase()
}
