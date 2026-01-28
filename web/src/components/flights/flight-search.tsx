'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, Plane, Calendar, Users, X, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFlightSearch, type FlightOffer, type FlightSearchParams } from '@/hooks/use-flight-search'
import { FlightCard } from './flight-card'

// =============================================================================
// Types
// =============================================================================

interface FlightSearchProps {
  onFlightSelect?: (offer: FlightOffer) => void
  selectedFlightId?: string
  className?: string
  defaultOrigin?: string
  defaultDestination?: string
  defaultDepartureDate?: string
  defaultReturnDate?: string
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
// Component
// =============================================================================

export function FlightSearch({
  onFlightSelect,
  selectedFlightId,
  className,
  defaultOrigin = '',
  defaultDestination = '',
  defaultDepartureDate = '',
  defaultReturnDate = '',
}: FlightSearchProps) {
  const { search, results, isLoading, error, clear } = useFlightSearch()

  // Search form state
  const [origin, setOrigin] = useState(defaultOrigin)
  const [destination, setDestination] = useState(defaultDestination)
  const [departureDate, setDepartureDate] = useState(defaultDepartureDate)
  const [returnDate, setReturnDate] = useState(defaultReturnDate)
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
    setDestination('')
    setDepartureDate('')
    setReturnDate('')
    setAdults(1)
    setCabinClass('ECONOMY')
    setNonstopOnly(false)
    clear()
    setHasSearched(false)
  }, [clear])

  const hasFilters = origin || destination || departureDate

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Airports Row */}
        <div className="flex items-center gap-2">
          {/* Origin */}
          <div className="relative flex-1">
            <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="From (e.g., LAX)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              maxLength={3}
              className="pl-10 h-12 text-base uppercase"
            />
          </div>

          {/* Swap button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={swapAirports}
            className="shrink-0"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Button>

          {/* Destination */}
          <div className="relative flex-1">
            <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90" />
            <Input
              type="text"
              placeholder="To (e.g., JFK)"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              maxLength={3}
              className="pl-10 h-12 text-base uppercase"
            />
          </div>
        </div>

        {/* Dates Row */}
        <div className="flex flex-wrap gap-3">
          {/* Departure Date */}
          <div className="relative flex-1 min-w-[160px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Depart"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Return Date */}
          <div className="relative flex-1 min-w-[160px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Return (optional)"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Passengers */}
          <div className="relative w-[100px]">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min={1}
              max={9}
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Cabin Class */}
          <div className="flex gap-2">
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
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={nonstopOnly}
              onChange={(e) => setNonstopOnly(e.target.checked)}
              className="rounded border-muted-foreground"
            />
            <span className="text-muted-foreground">Nonstop only</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isLoading || !origin || !destination || !departureDate}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Flights
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

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.offers.map((offer) => (
                <FlightCard
                  key={offer.id}
                  offer={offer}
                  onSelect={onFlightSelect}
                  selected={selectedFlightId === offer.id}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {results.offers.length === 0 && (
            <div className="text-center py-12">
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
          <Plane className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Search for flights to your destination</p>
        </div>
      )}
    </div>
  )
}
