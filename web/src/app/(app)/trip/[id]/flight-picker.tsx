'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Loader2, Plane, Calendar, Users, X, ArrowRightLeft, MapPin, Info, Check, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useFlightSearch, type FlightOffer, type FlightSearchParams } from '@/hooks/use-flight-search'
import { FlightCard } from '@/components/flights/flight-card'

// =============================================================================
// Types
// =============================================================================

export interface FlightPickerConstraints {
  eventCity: string | null
  eventDate: string | null
  eventTime: string | null
  eventVenue: string | null
  suggestedDestination?: string
  suggestedDepartureDate?: string
  suggestedReturnDate?: string
}

// Constraint status for a flight
export type ConstraintStatus = 'good' | 'warning' | 'bad'

export interface FlightConstraintResult {
  arrivalStatus: ConstraintStatus
  arrivalMessage: string
  hoursBeforeEvent: number | null
  returnStatus: ConstraintStatus | null
  returnMessage: string | null
  hoursAfterEventEnd: number | null
}

interface FlightPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFlightSelect: (offer: FlightOffer) => void
  onSkip?: () => void
  constraints: FlightPickerConstraints
  isUpdating?: boolean
  className?: string
}

// =============================================================================
// Cabin Class Options
// =============================================================================

const CABIN_CLASSES = [
  { id: 'ECONOMY', label: 'Economy' },
  { id: 'PREMIUM_ECONOMY', label: 'Premium' },
  { id: 'BUSINESS', label: 'Business' },
  { id: 'FIRST', label: 'First' },
] as const

type CabinClass = typeof CABIN_CLASSES[number]['id']

// =============================================================================
// Constraint Checking
// =============================================================================

const GOOD_BUFFER_HOURS = 4  // Arrive 4+ hours before event = good
const WARNING_BUFFER_HOURS = 2  // Arrive 2-4 hours before event = warning
const EVENT_DURATION_HOURS = 3  // Assume events last ~3 hours
const GOOD_RETURN_BUFFER_HOURS = 12  // Leave 12+ hours after event end = good
const WARNING_RETURN_BUFFER_HOURS = 4  // Leave 4-12 hours after event end = warning

function checkFlightConstraints(
  offer: FlightOffer,
  constraints: FlightPickerConstraints
): FlightConstraintResult {
  let arrivalStatus: ConstraintStatus = 'good'
  let arrivalMessage = 'No event time to check against'
  let hoursBeforeEvent: number | null = null
  let returnStatus: ConstraintStatus | null = null
  let returnMessage: string | null = null
  let hoursAfterEventEnd: number | null = null

  // If no event date/time, we can't check constraints
  if (!constraints.eventDate || !constraints.eventTime) {
    return {
      arrivalStatus,
      arrivalMessage,
      hoursBeforeEvent,
      returnStatus,
      returnMessage,
      hoursAfterEventEnd,
    }
  }

  // Parse event datetime and calculate event end
  const eventDateTime = new Date(`${constraints.eventDate}T${constraints.eventTime}:00`)
  const eventEndDateTime = new Date(eventDateTime.getTime() + EVENT_DURATION_HOURS * 60 * 60 * 1000)

  // ==========================================================================
  // Check ARRIVAL constraint (outbound flight)
  // ==========================================================================
  const lastOutbound = offer.outbound_segments[offer.outbound_segments.length - 1]
  const arrivalTimeStr = lastOutbound.arrival_time
  const arrivalDateTime = new Date(arrivalTimeStr)

  // Calculate hours before event
  const arrivalDiffMs = eventDateTime.getTime() - arrivalDateTime.getTime()
  hoursBeforeEvent = arrivalDiffMs / (1000 * 60 * 60)

  // Check if arrival is on the event day
  const arrivalDate = arrivalTimeStr.split('T')[0]
  const isEventDay = arrivalDate === constraints.eventDate

  if (hoursBeforeEvent < 0) {
    arrivalStatus = 'bad'
    arrivalMessage = `Arrives ${Math.abs(hoursBeforeEvent).toFixed(1)}h after event starts`
  } else if (hoursBeforeEvent < WARNING_BUFFER_HOURS) {
    arrivalStatus = 'bad'
    arrivalMessage = `Only ${hoursBeforeEvent.toFixed(1)}h before event - too tight!`
  } else if (hoursBeforeEvent < GOOD_BUFFER_HOURS) {
    arrivalStatus = 'warning'
    arrivalMessage = `${hoursBeforeEvent.toFixed(1)}h before event - cutting it close`
  } else if (isEventDay) {
    arrivalStatus = 'good'
    arrivalMessage = `${hoursBeforeEvent.toFixed(1)}h before event`
  } else {
    arrivalStatus = 'good'
    arrivalMessage = 'Arrives before event day'
  }

  // ==========================================================================
  // Check RETURN constraint (return flight)
  // ==========================================================================
  if (offer.is_round_trip && offer.return_segments && offer.return_segments.length > 0) {
    const firstReturn = offer.return_segments[0]
    const returnDepartureTimeStr = firstReturn.departure_time
    const returnDepartureDateTime = new Date(returnDepartureTimeStr)

    // Calculate hours after event ends
    const returnDiffMs = returnDepartureDateTime.getTime() - eventEndDateTime.getTime()
    hoursAfterEventEnd = returnDiffMs / (1000 * 60 * 60)

    const returnDate = returnDepartureTimeStr.split('T')[0]
    const isReturnEventDay = returnDate === constraints.eventDate

    if (hoursAfterEventEnd < 0) {
      // Departs before event ends
      returnStatus = 'bad'
      returnMessage = `Departs ${Math.abs(hoursAfterEventEnd).toFixed(1)}h before event ends!`
    } else if (hoursAfterEventEnd < WARNING_RETURN_BUFFER_HOURS) {
      if (isReturnEventDay) {
        returnStatus = 'warning'
        returnMessage = `Same day return - ${hoursAfterEventEnd.toFixed(1)}h after event`
      } else {
        returnStatus = 'good'
        returnMessage = `Next day departure`
      }
    } else if (hoursAfterEventEnd < GOOD_RETURN_BUFFER_HOURS) {
      returnStatus = 'good'
      returnMessage = `${hoursAfterEventEnd.toFixed(1)}h after event ends`
    } else {
      returnStatus = 'good'
      returnMessage = 'Departs day after event'
    }
  }

  return {
    arrivalStatus,
    arrivalMessage,
    hoursBeforeEvent,
    returnStatus,
    returnMessage,
    hoursAfterEventEnd,
  }
}

// =============================================================================
// Constraint Chip Component
// =============================================================================

function ConstraintChip({ status, message }: { status: ConstraintStatus; message: string }) {
  if (status === 'good') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">
        <Check className="w-3 h-3" />
        <span>{message}</span>
      </div>
    )
  }

  if (status === 'warning') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
        <AlertTriangle className="w-3 h-3" />
        <span>{message}</span>
      </div>
    )
  }

  // bad
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs">
      <XCircle className="w-3 h-3" />
      <span>{message}</span>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function FlightPicker({
  open,
  onOpenChange,
  onFlightSelect,
  onSkip,
  constraints,
  isUpdating = false,
  className,
}: FlightPickerProps) {
  const { search, results, isLoading, error, clear } = useFlightSearch()

  // Skip confirmation state
  const [skipConfirming, setSkipConfirming] = useState(false)
  const skipTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Reset skip confirmation when picker closes
  useEffect(() => {
    if (!open) setSkipConfirming(false)
    return () => { if (skipTimerRef.current) clearTimeout(skipTimerRef.current) }
  }, [open])

  const handleSkipClick = () => {
    if (!skipConfirming) {
      setSkipConfirming(true)
      skipTimerRef.current = setTimeout(() => setSkipConfirming(false), 3000)
      return
    }
    setSkipConfirming(false)
    onSkip?.()
  }

  // Search form state
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState(constraints.suggestedDestination || '')
  const [departureDate, setDepartureDate] = useState(constraints.suggestedDepartureDate || '')
  const [returnDate, setReturnDate] = useState(constraints.suggestedReturnDate || '')
  const [adults, setAdults] = useState(1)
  const [cabinClass, setCabinClass] = useState<CabinClass>('ECONOMY')
  const [nonstopOnly, setNonstopOnly] = useState(false)

  // Track if we've searched
  const [hasSearched, setHasSearched] = useState(false)

  const swapAirports = useCallback(() => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }, [origin, destination])

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!origin || !destination || !departureDate) {
      return
    }

    const params: FlightSearchParams = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      adults,
      cabinClass,
      nonstopOnly,
      maxOffers: 20,
    }

    if (returnDate) {
      params.returnDate = returnDate
    }

    await search(params)
    setHasSearched(true)
  }, [origin, destination, departureDate, returnDate, adults, cabinClass, nonstopOnly, search])

  const handleClear = useCallback(() => {
    setOrigin('')
    setDestination(constraints.suggestedDestination || '')
    setDepartureDate(constraints.suggestedDepartureDate || '')
    setReturnDate(constraints.suggestedReturnDate || '')
    setAdults(1)
    setCabinClass('ECONOMY')
    setNonstopOnly(false)
    clear()
    setHasSearched(false)
  }, [clear, constraints])

  const handleFlightClick = (offer: FlightOffer) => {
    onFlightSelect(offer)
  }

  const hasFilters = origin || destination !== (constraints.suggestedDestination || '') || departureDate

  // Content that's shared between mobile (sheet) and desktop (panel)
  const pickerContent = (
    <div className="flex flex-col h-full">
      {/* Constraint Feedback */}
      <div className="bg-muted/50 border-b p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Flight constraints</p>
            <div className="space-y-1 text-muted-foreground">
              {constraints.eventCity && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Destination: <span className="text-foreground font-medium">{constraints.eventCity}</span></span>
                </div>
              )}
              {constraints.eventDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Event: <span className="text-foreground font-medium">{formatDate(constraints.eventDate)}</span>
                    {constraints.eventTime && (
                      <span className="text-foreground font-medium"> at {formatTime(constraints.eventTime)}</span>
                    )}
                  </span>
                </div>
              )}
              {constraints.eventTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">Arrive 4+ hours before for best buffer</span>
                </div>
              )}
              {constraints.eventVenue && (
                <p className="text-xs opacity-75">at {constraints.eventVenue}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="p-3 sm:p-4 border-b">
        <form onSubmit={handleSearch} className="space-y-3">
          {/* Airports Row */}
          <div className="flex items-center gap-2">
            {/* Origin */}
            <div className="relative flex-1">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="From (e.g., SFO)"
                aria-label="Origin airport code"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                maxLength={3}
                className="pl-10 h-11 text-base uppercase"
              />
            </div>

            {/* Swap button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={swapAirports}
              aria-label="Swap origin and destination"
              className="shrink-0 h-11 w-11"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>

            {/* Destination */}
            <div className="relative flex-1">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90" />
              <Input
                type="text"
                placeholder="To (e.g., LAX)"
                aria-label="Destination airport code"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                maxLength={3}
                className="pl-10 h-11 text-base uppercase"
              />
            </div>
          </div>

          {/* Dates Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Departure Date */}
            <div className="relative flex-1 sm:min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Depart"
                aria-label="Departure date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Return Date */}
            <div className="relative flex-1 sm:min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Return"
                aria-label="Return date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Passengers */}
            <div className="relative w-full sm:w-[80px]">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                max={9}
                aria-label="Number of passengers"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Options Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Cabin Class */}
            <div className="flex gap-1.5 flex-wrap">
              {CABIN_CLASSES.map((cabin) => (
                <button
                  key={cabin.id}
                  type="button"
                  onClick={() => setCabinClass(cabin.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    cabinClass === cabin.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  {cabin.label}
                </button>
              ))}
            </div>

            {/* Nonstop toggle */}
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={nonstopOnly}
                onChange={(e) => setNonstopOnly(e.target.checked)}
                className="rounded border-muted-foreground w-3.5 h-3.5"
              />
              <span className="text-muted-foreground">nonstop only</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={isLoading || !origin || !destination || !departureDate}
              className="gap-2 flex-1 sm:flex-none h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  search flights
                </>
              )}
            </Button>

            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="gap-1 text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 relative">
        {isUpdating && !results && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card p-4 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex justify-between mb-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                  <div className="h-5 w-16 bg-muted rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-12 bg-muted rounded" />
                  <div className="h-px flex-1 bg-muted" />
                  <div className="h-3 w-12 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isUpdating && results && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.totalCount === 0 ? (
                  'No flights found'
                ) : (
                  <>
                    Found <span className="font-medium text-foreground">{results.totalCount}</span> flight{results.totalCount !== 1 ? 's' : ''}
                  </>
                )}
              </p>
            </div>

            {/* Results list */}
            {results.offers.length > 0 && (
              <div className="space-y-3">
                {results.offers.map((offer) => {
                  const constraintResult = checkFlightConstraints(offer, constraints)
                  return (
                    <div key={offer.id} className="space-y-2">
                      {/* Constraint chips */}
                      {constraints.eventDate && constraints.eventTime && (
                        <div className="flex flex-wrap gap-2">
                          <ConstraintChip
                            status={constraintResult.arrivalStatus}
                            message={`Arrival: ${constraintResult.arrivalMessage}`}
                          />
                          {constraintResult.returnStatus && constraintResult.returnMessage && (
                            <ConstraintChip
                              status={constraintResult.returnStatus}
                              message={`Return: ${constraintResult.returnMessage}`}
                            />
                          )}
                        </div>
                      )}
                      <FlightCard
                        offer={offer}
                        onSelect={handleFlightClick}
                        compact
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty state */}
            {results.offers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">No flights match your search</p>
                <p className="text-sm text-muted-foreground">
                  Try different dates or airports
                </p>
              </div>
            )}
          </div>
        )}

        {/* Initial state */}
        {!hasSearched && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Plane className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">enter your origin airport and search</p>
          </div>
        )}
      </div>

      {/* Footer with skip option */}
      {onSkip && (
        <div className="border-t p-3 sm:p-4">
          <button
            onClick={handleSkipClick}
            className={cn(
              "text-sm transition-colors w-full text-center min-h-[44px] rounded-lg",
              skipConfirming
                ? "text-destructive font-medium bg-destructive/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {skipConfirming ? 'tap again to skip flights' : "i don't need flights for this trip"}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile: Sheet/Drawer from bottom */}
      <div className="sm:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className={cn('h-[90vh] p-0 rounded-t-xl', className)}
            showCloseButton={false}
          >
            <SheetHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="lowercase">add flights</SheetTitle>
                  <SheetDescription>
                    search and select your flights
                  </SheetDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  aria-label="close"
                  className="shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </SheetHeader>
            {pickerContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Sheet/Panel from right */}
      <div className="hidden sm:block">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="right"
            className={cn('w-full max-w-xl p-0 sm:max-w-xl', className)}
            showCloseButton={false}
          >
            <SheetHeader className="p-5 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="lowercase">add flights</SheetTitle>
                  <SheetDescription>
                    search and select your flights
                  </SheetDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  aria-label="close"
                  className="shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </SheetHeader>
            {pickerContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
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
  }).toLowerCase()
}
