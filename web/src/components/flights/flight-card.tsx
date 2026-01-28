'use client'

import { Plane, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FlightOffer, FlightSegment } from '@/hooks/use-flight-search'

// =============================================================================
// Types
// =============================================================================

interface FlightCardProps {
  offer: FlightOffer
  onSelect?: (offer: FlightOffer) => void
  selected?: boolean
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function FlightCard({
  offer,
  onSelect,
  selected = false,
  className,
}: FlightCardProps) {
  const {
    price,
    currency,
    outbound_segments,
    outbound_duration_formatted,
    outbound_stops,
    return_segments,
    return_duration_formatted,
    return_stops,
    validating_carrier_name,
    validating_carrier,
    is_nonstop,
    is_round_trip,
  } = offer

  const outboundFirst = outbound_segments[0]
  const outboundLast = outbound_segments[outbound_segments.length - 1]

  const returnFirst = return_segments?.[0]
  const returnLast = return_segments?.[return_segments.length - 1]

  const carrierDisplay = validating_carrier_name || validating_carrier

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card overflow-hidden transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        selected && 'ring-2 ring-primary border-primary',
        className
      )}
    >
      <div className="p-4 space-y-4">
        {/* Header - Carrier and Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Plane className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm">{carrierDisplay}</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              ${Math.round(price)}
            </p>
            <p className="text-xs text-muted-foreground">
              {is_round_trip ? 'round trip' : 'one way'}
            </p>
          </div>
        </div>

        {/* Outbound Flight */}
        <FlightLeg
          label="Depart"
          segments={outbound_segments}
          firstSegment={outboundFirst}
          lastSegment={outboundLast}
          duration={outbound_duration_formatted}
          stops={outbound_stops}
        />

        {/* Return Flight */}
        {is_round_trip && returnFirst && returnLast && (
          <>
            <div className="border-t border-dashed" />
            <FlightLeg
              label="Return"
              segments={return_segments!}
              firstSegment={returnFirst}
              lastSegment={returnLast}
              duration={return_duration_formatted || ''}
              stops={return_stops || 0}
            />
          </>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {is_nonstop && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium dark:bg-green-900/30 dark:text-green-400">
              Nonstop
            </span>
          )}
          {offer.seats_available && offer.seats_available <= 5 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium dark:bg-orange-900/30 dark:text-orange-400">
              {offer.seats_available} seats left
            </span>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={() => onSelect?.(offer)}
          variant={selected ? 'default' : 'outline'}
          size="sm"
          className="w-full"
        >
          {selected ? 'Selected' : 'Select Flight'}
        </Button>
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          ✓ Selected
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Flight Leg Component
// =============================================================================

interface FlightLegProps {
  label: string
  segments: FlightSegment[]
  firstSegment: FlightSegment
  lastSegment: FlightSegment
  duration: string
  stops: number
}

function FlightLeg({
  label,
  firstSegment,
  lastSegment,
  duration,
  stops,
}: FlightLegProps) {
  const departureTime = formatTime(firstSegment.departure_time)
  const arrivalTime = formatTime(lastSegment.arrival_time)
  const stopText = stops === 0 ? 'Nonstop' : stops === 1 ? '1 stop' : `${stops} stops`

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>

      <div className="flex items-center gap-3">
        {/* Departure */}
        <div className="text-center min-w-[60px]">
          <p className="text-lg font-semibold">{departureTime}</p>
          <p className="text-xs text-muted-foreground">{firstSegment.departure_airport}</p>
        </div>

        {/* Flight line */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 border-t border-dashed relative">
            <Plane className="w-3 h-3 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground rotate-90" />
          </div>
        </div>

        {/* Arrival */}
        <div className="text-center min-w-[60px]">
          <p className="text-lg font-semibold">{arrivalTime}</p>
          <p className="text-xs text-muted-foreground">{lastSegment.arrival_airport}</p>
        </div>
      </div>

      {/* Duration and stops */}
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {duration}
        </span>
        <span>·</span>
        <span>{stopText}</span>
      </div>
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(isoDateTime: string): string {
  try {
    const date = new Date(isoDateTime)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase()
  } catch {
    return isoDateTime.slice(11, 16) // Fallback: extract HH:MM
  }
}
