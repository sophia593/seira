'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, Hotel, Calendar, Users, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useHotelSearch, type HotelOffer, type HotelSearchParams } from '@/hooks/use-hotel-search'
import { HotelCard } from './hotel-card'

// =============================================================================
// Types
// =============================================================================

interface HotelSearchProps {
  onHotelSelect?: (offer: HotelOffer) => void
  selectedHotelId?: string
  className?: string
  defaultCity?: string
  defaultCheckIn?: string
  defaultCheckOut?: string
  defaultGuests?: number
}

// =============================================================================
// Rating Options
// =============================================================================

const RATING_OPTIONS = [
  { value: undefined, label: 'Any' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 5, label: '5' },
] as const

// =============================================================================
// Component
// =============================================================================

export function HotelSearch({
  onHotelSelect,
  selectedHotelId,
  className,
  defaultCity = '',
  defaultCheckIn = '',
  defaultCheckOut = '',
  defaultGuests = 2,
}: HotelSearchProps) {
  const { search, results, isLoading, error, clear } = useHotelSearch()

  // Search form state
  const [city, setCity] = useState(defaultCity)
  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState(defaultCheckOut)
  const [guests, setGuests] = useState(defaultGuests)
  const [minRating, setMinRating] = useState<number | undefined>(undefined)

  // Track if we've searched
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!city || !checkIn || !checkOut) {
      return
    }

    const params: HotelSearchParams = {
      city,
      checkIn,
      checkOut,
      adults: guests,
      rooms: 1,
      minRating,
      maxOffers: 20,
    }

    await search(params)
    setHasSearched(true)
  }, [city, checkIn, checkOut, guests, minRating, search])

  const handleClear = useCallback(() => {
    setCity('')
    setCheckIn('')
    setCheckOut('')
    setGuests(2)
    setMinRating(undefined)
    clear()
    setHasSearched(false)
  }, [clear])

  const hasFilters = city || checkIn || checkOut

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        {/* City Input */}
        <div className="relative">
          <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="City (e.g., Los Angeles)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Dates Row */}
        <div className="flex flex-wrap gap-3">
          {/* Check-in */}
          <div className="relative flex-1 min-w-[150px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Check-in"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Check-out */}
          <div className="relative flex-1 min-w-[150px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Check-out"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Guests */}
          <div className="relative w-[100px]">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min={1}
              max={9}
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Rating Filter */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Star className="w-4 h-4" />
            Min rating:
          </span>
          <div className="flex gap-2">
            {RATING_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setMinRating(option.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  minRating === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isLoading || !city || !checkIn || !checkOut}
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
                Search Hotels
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
                'No hotels found'
              ) : (
                <>
                  Found <span className="font-medium text-foreground">{results.totalCount}</span> hotel{results.totalCount !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>

          {/* Results grid */}
          {results.offers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.offers.map((offer) => (
                <HotelCard
                  key={offer.id}
                  offer={offer}
                  onSelect={onHotelSelect}
                  selected={selectedHotelId === offer.id}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {results.offers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No hotels match your search</p>
              <p className="text-sm text-muted-foreground">
                Try different dates or location
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Hotel className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Search for hotels near your event</p>
        </div>
      )}
    </div>
  )
}
