"use client"

import { memo } from "react"
import { Plane, Clock, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useConversationStore,
  selectSelectedFlight,
  selectReturnFlight,
  type SelectedFlight,
} from "@/stores/conversation-store"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FlightFromApi {
  id: string
  airline: string
  flight_number: string
  departure_airport: string
  departure_time: string
  departure_date: string
  arrival_airport: string
  arrival_time: string
  arrival_date: string
  price: number
  duration: string
  stops?: number
}

interface FlightResultsGridProps {
  outboundFlights: FlightFromApi[]
  returnFlights?: FlightFromApi[]
  className?: string
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const FlightResultsGrid = memo(function FlightResultsGrid({
  outboundFlights,
  returnFlights,
  className,
}: FlightResultsGridProps) {
  const selectedFlight = useConversationStore(selectSelectedFlight)
  const selectedReturn = useConversationStore(selectReturnFlight)
  const setSelectedFlight = useConversationStore((s) => s.selectFlight)
  const setReturnFlight = useConversationStore((s) => s.selectReturnFlight)

  if (!outboundFlights || outboundFlights.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No flights found matching your search.
      </div>
    )
  }

  const handleSelectOutbound = (flight: FlightFromApi) => {
    if (selectedFlight?.id === flight.id) {
      setSelectedFlight(null)
    } else {
      setSelectedFlight(mapFlightToSelected(flight))
    }
  }

  const handleSelectReturn = (flight: FlightFromApi) => {
    if (selectedReturn?.id === flight.id) {
      setReturnFlight(null)
    } else {
      setReturnFlight(mapFlightToSelected(flight))
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Outbound Flights */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Outbound Flights ({outboundFlights.length})
        </p>
        <div className="space-y-2">
          {outboundFlights.slice(0, 4).map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              isSelected={selectedFlight?.id === flight.id}
              onSelect={() => handleSelectOutbound(flight)}
            />
          ))}
        </div>
        {outboundFlights.length > 4 && (
          <p className="text-xs text-muted-foreground">
            +{outboundFlights.length - 4} more options
          </p>
        )}
      </div>

      {/* Return Flights */}
      {returnFlights && returnFlights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Return Flights ({returnFlights.length})
          </p>
          <div className="space-y-2">
            {returnFlights.slice(0, 4).map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                isSelected={selectedReturn?.id === flight.id}
                onSelect={() => handleSelectReturn(flight)}
              />
            ))}
          </div>
          {returnFlights.length > 4 && (
            <p className="text-xs text-muted-foreground">
              +{returnFlights.length - 4} more options
            </p>
          )}
        </div>
      )}

      {/* Selection Summary */}
      {(selectedFlight || selectedReturn) && (
        <SelectionSummary
          outbound={selectedFlight}
          returnFlight={selectedReturn}
        />
      )}
    </div>
  )
})

// -----------------------------------------------------------------------------
// Flight Card
// -----------------------------------------------------------------------------

interface FlightCardProps {
  flight: FlightFromApi
  isSelected: boolean
  onSelect: () => void
}

function FlightCard({ flight, isSelected, onSelect }: FlightCardProps) {
  const stopsText =
    flight.stops === 0
      ? "Nonstop"
      : flight.stops === 1
      ? "1 stop"
      : `${flight.stops} stops`

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-background"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Airline & Flight */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <Plane className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{flight.airline}</p>
            <p className="text-xs text-muted-foreground">{flight.flight_number}</p>
          </div>
        </div>

        {/* Times */}
        <div className="flex items-center gap-3 text-center">
          <div>
            <p className="text-sm font-medium">{flight.departure_time}</p>
            <p className="text-xs text-muted-foreground">{flight.departure_airport}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{flight.duration}</span>
            </div>
            <div className="w-16 h-px bg-border my-1" />
            <span className="text-xs text-muted-foreground">{stopsText}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{flight.arrival_time}</p>
            <p className="text-xs text-muted-foreground">{flight.arrival_airport}</p>
          </div>
        </div>

        {/* Price & Selection */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-primary">
            ${flight.price}
          </p>
          {isSelected && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </div>
      </div>
    </button>
  )
}

// -----------------------------------------------------------------------------
// Selection Summary
// -----------------------------------------------------------------------------

interface SelectionSummaryProps {
  outbound: SelectedFlight | null
  returnFlight: SelectedFlight | null
}

function SelectionSummary({ outbound, returnFlight }: SelectionSummaryProps) {
  const total = (outbound?.price || 0) + (returnFlight?.price || 0)

  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
      <p className="text-xs font-medium text-primary mb-2">Selected Flights</p>
      <div className="space-y-1 text-xs">
        {outbound && (
          <div className="flex justify-between">
            <span>
              Outbound: {outbound.airline} {outbound.flightNumber}
            </span>
            <span>${outbound.price}</span>
          </div>
        )}
        {returnFlight && (
          <div className="flex justify-between">
            <span>
              Return: {returnFlight.airline} {returnFlight.flightNumber}
            </span>
            <span>${returnFlight.price}</span>
          </div>
        )}
        <div className="flex justify-between font-medium pt-1 border-t border-primary/20">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function mapFlightToSelected(flight: FlightFromApi): SelectedFlight {
  return {
    id: flight.id,
    airline: flight.airline,
    flightNumber: flight.flight_number,
    departure: {
      airport: flight.departure_airport,
      time: flight.departure_time,
      date: flight.departure_date,
    },
    arrival: {
      airport: flight.arrival_airport,
      time: flight.arrival_time,
      date: flight.arrival_date,
    },
    price: flight.price,
    duration: flight.duration,
  }
}
