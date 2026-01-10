"use client"

import { memo, useState } from "react"
import { Calendar, MapPin, Plane, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  useConversationStore,
  selectSelectedEvent,
  selectSelectedFlight,
  selectReturnFlight,
} from "@/stores/conversation-store"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TripConfirmationProps {
  onConfirm: () => Promise<void>
  onCancel: () => void
  className?: string
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const TripConfirmation = memo(function TripConfirmation({
  onConfirm,
  onCancel,
  className,
}: TripConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const selectedEvent = useConversationStore(selectSelectedEvent)
  const selectedFlight = useConversationStore(selectSelectedFlight)
  const returnFlight = useConversationStore(selectReturnFlight)
  const clearSelections = useConversationStore((s) => s.clearSelections)

  // Must have at least an event
  if (!selectedEvent) {
    return (
      <div className={cn("text-sm text-muted-foreground py-2", className)}>
        Please select an event to create a trip.
      </div>
    )
  }

  const flightTotal = (selectedFlight?.price || 0) + (returnFlight?.price || 0)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      clearSelections()
    } catch {
      // Error handling is done by the parent component
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    clearSelections()
    onCancel()
  }

  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Confirm Your Trip</h3>
      </div>

      {/* Event Summary */}
      <div className="rounded-lg bg-muted/50 p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Event
        </p>
        <div className="flex gap-3">
          {selectedEvent.imageUrl && (
            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
              <img
                src={selectedEvent.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{selectedEvent.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(selectedEvent.date)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{selectedEvent.venue}, {selectedEvent.city}</span>
            </div>
          </div>
        </div>
        {selectedEvent.priceRange && (
          <p className="text-xs text-primary font-medium">
            Tickets: {selectedEvent.priceRange}
          </p>
        )}
      </div>

      {/* Flight Summary */}
      {selectedFlight && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Flights
          </p>

          {/* Outbound */}
          <FlightSummaryRow
            label="Outbound"
            flight={selectedFlight}
          />

          {/* Return */}
          {returnFlight && (
            <FlightSummaryRow
              label="Return"
              flight={returnFlight}
            />
          )}

          {/* Total */}
          <div className="flex justify-between text-sm font-medium pt-2 border-t">
            <span>Flight Total</span>
            <span className="text-primary">${flightTotal}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isConfirming}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="flex-1"
        >
          {isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Trip
            </>
          )}
        </Button>
      </div>
    </div>
  )
})

// -----------------------------------------------------------------------------
// Flight Summary Row
// -----------------------------------------------------------------------------

interface FlightSummaryRowProps {
  label: string
  flight: {
    airline: string
    flightNumber: string
    departure: { airport: string; time: string; date: string }
    arrival: { airport: string; time: string }
    price: number
    duration: string
  }
}

function FlightSummaryRow({ label, flight }: FlightSummaryRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Plane className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground">{label}:</span>
        <span>
          {flight.departure.airport} to {flight.arrival.airport}
        </span>
      </div>
      <span className="text-muted-foreground">${flight.price}</span>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatDate(date: string): string {
  try {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return date
  }
}
