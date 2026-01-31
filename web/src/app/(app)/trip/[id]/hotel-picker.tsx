'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Loader2, Hotel, Calendar, Users, Star, X, MapPin, Info, Check, AlertTriangle, XCircle } from 'lucide-react'
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
import { useHotelSearch, type HotelOffer, type HotelSearchParams } from '@/hooks/use-hotel-search'
import { HotelCard } from '@/components/hotels/hotel-card'

// =============================================================================
// Types
// =============================================================================

export interface HotelPickerConstraints {
  eventCity: string | null
  eventDate: string | null
  eventVenue: string | null
  suggestedCity?: string
  suggestedCheckIn?: string
  suggestedCheckOut?: string
}

// Distance constraint categories
export type DistanceCategory = 'walk' | 'transit' | 'far'

export interface HotelConstraintResult {
  category: DistanceCategory
  message: string
}

// =============================================================================
// Constraint Checking
// =============================================================================

const WALK_DISTANCE_KM = 1.0    // <1km = walkable
const TRANSIT_DISTANCE_KM = 5.0  // 1-5km = transit

function checkHotelConstraints(distanceKm: number | null | undefined): HotelConstraintResult {
  if (distanceKm === undefined || distanceKm === null) {
    return {
      category: 'transit',
      message: 'Distance unknown',
    }
  }

  if (distanceKm <= WALK_DISTANCE_KM) {
    return {
      category: 'walk',
      message: `${distanceKm.toFixed(1)}km - walkable to venue`,
    }
  }

  if (distanceKm <= TRANSIT_DISTANCE_KM) {
    return {
      category: 'transit',
      message: `${distanceKm.toFixed(1)}km - short transit ride`,
    }
  }

  return {
    category: 'far',
    message: `${distanceKm.toFixed(1)}km - will need a car/taxi`,
  }
}

// =============================================================================
// Constraint Chip Component
// =============================================================================

function DistanceChip({ category, message }: HotelConstraintResult) {
  if (category === 'walk') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">
        <Check className="w-3 h-3" />
        <span>{message}</span>
      </div>
    )
  }

  if (category === 'transit') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
        <AlertTriangle className="w-3 h-3" />
        <span>{message}</span>
      </div>
    )
  }

  // far
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs">
      <XCircle className="w-3 h-3" />
      <span>{message}</span>
    </div>
  )
}

interface HotelPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onHotelSelect: (offer: HotelOffer) => void
  onSkip?: () => void
  constraints: HotelPickerConstraints
  isUpdating?: boolean
  className?: string
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

export function HotelPicker({
  open,
  onOpenChange,
  onHotelSelect,
  onSkip,
  constraints,
  isUpdating = false,
  className,
}: HotelPickerProps) {
  const { search, results, isLoading, error, clear } = useHotelSearch()

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
  const [city, setCity] = useState(constraints.suggestedCity || '')
  const [checkIn, setCheckIn] = useState(constraints.suggestedCheckIn || '')
  const [checkOut, setCheckOut] = useState(constraints.suggestedCheckOut || '')
  const [guests, setGuests] = useState(2)
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
    setCity(constraints.suggestedCity || '')
    setCheckIn(constraints.suggestedCheckIn || '')
    setCheckOut(constraints.suggestedCheckOut || '')
    setGuests(2)
    setMinRating(undefined)
    clear()
    setHasSearched(false)
  }, [clear, constraints])

  const handleHotelClick = (offer: HotelOffer) => {
    onHotelSelect(offer)
  }

  const hasFilters = city !== (constraints.suggestedCity || '') || checkIn || minRating !== undefined

  // Content shared between mobile (sheet) and desktop (panel)
  const pickerContent = (
    <div className="flex flex-col h-full">
      {/* Constraint Feedback */}
      <div className="bg-muted/50 border-b p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Hotel constraints</p>
            <div className="space-y-1 text-muted-foreground">
              {constraints.eventCity && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Location: <span className="text-foreground font-medium">{constraints.eventCity}</span></span>
                </div>
              )}
              {constraints.eventDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Event date: <span className="text-foreground font-medium">{formatDate(constraints.eventDate)}</span></span>
                </div>
              )}
              {constraints.eventVenue && (
                <p className="text-xs opacity-75">near {constraints.eventVenue}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="p-3 sm:p-4 border-b">
        <form onSubmit={handleSearch} className="space-y-3">
          {/* City Input */}
          <div className="relative">
            <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="City (e.g., Los Angeles)"
              aria-label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>

          {/* Dates Row */}
          <div className="flex flex-wrap gap-2">
            {/* Check-in */}
            <div className="relative flex-1 min-w-[130px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Check-in"
                aria-label="Check-in date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Check-out */}
            <div className="relative flex-1 min-w-[130px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Check-out"
                aria-label="Check-out date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Guests */}
            <div className="relative w-[80px]">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                max={9}
                aria-label="Number of guests"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              Min:
            </span>
            <div className="flex gap-1.5">
              {RATING_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setMinRating(option.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
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
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={isLoading || !city || !checkIn || !checkOut}
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
                  search hotels
                </>
              )}
            </Button>

            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="gap-1 text-muted-foreground h-11"
              >
                <X className="w-3.5 h-3.5" />
                clear
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
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-muted rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-3 w-8 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-muted rounded shrink-0" />
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
                  'no hotels found'
                ) : (
                  <>
                    found <span className="font-medium text-foreground">{results.totalCount}</span> hotel{results.totalCount !== 1 ? 's' : ''}
                  </>
                )}
              </p>
            </div>

            {/* Results list */}
            {results.offers.length > 0 && (
              <div className="space-y-3">
                {results.offers.map((offer) => {
                  const constraintResult = checkHotelConstraints(offer.distance_km)
                  return (
                    <div key={offer.id} className="space-y-2">
                      {/* Distance constraint chip */}
                      <DistanceChip {...constraintResult} />
                      <HotelCard
                        offer={offer}
                        onSelect={handleHotelClick}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty state */}
            {results.offers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">no hotels match your search</p>
                <p className="text-sm text-muted-foreground">
                  try different dates or location
                </p>
              </div>
            )}
          </div>
        )}

        {/* Initial state */}
        {!hasSearched && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Hotel className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">enter your city and dates to search</p>
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
            {skipConfirming ? 'tap again to skip hotel' : "i don't need a hotel for this trip"}
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
                  <SheetTitle className="lowercase">add hotel</SheetTitle>
                  <SheetDescription>
                    search and select your hotel
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
                  <SheetTitle className="lowercase">add hotel</SheetTitle>
                  <SheetDescription>
                    search and select your hotel
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
