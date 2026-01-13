'use client'

import { memo, useState, useMemo } from 'react'
import { EventCard } from '../event-card'
import { type Event } from '@/types/event'
import {
  useConversationStore,
  selectSelectedEvent,
  type SelectedEvent,
} from '@/stores/conversation-store'
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface EventFromApi {
  id: string
  name: string
  date: string
  time?: string
  venue?: string
  venue_name?: string
  city?: string
  venue_city?: string
  state?: string
  venue_state?: string
  image_url?: string
  price_range?: string
  price_min?: number
  url?: string
  purchase_url?: string
  ticket_url?: string
}

interface EventResultsGridProps {
  events: EventFromApi[]
  onSelect?: (event: SelectedEvent) => void
  className?: string
}

interface Filters {
  priceRange: [number, number]
  dateRange: [Date | null, Date | null]
}

// =============================================================================
// Constants
// =============================================================================

const INITIAL_DISPLAY_COUNT = 6
const PRICE_MIN = 0
const PRICE_MAX = 1000

// =============================================================================
// Price Range Slider Component
// =============================================================================

interface PriceSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

function PriceSlider({ min, max, value, onChange }: PriceSliderProps) {
  const [localMin, localMax] = value

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localMax - 10)
    onChange([newMin, localMax])
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localMin + 10)
    onChange([localMin, newMax])
  }

  // Calculate positions for the filled track
  const minPercent = ((localMin - min) / (max - min)) * 100
  const maxPercent = ((localMax - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>${localMin}</span>
        <span>${localMax === PRICE_MAX ? `${PRICE_MAX}+` : localMax}</span>
      </div>
      <div className="relative h-2">
        {/* Track background */}
        <div className="absolute inset-0 rounded-full bg-muted" />
        {/* Filled track */}
        <div
          className="absolute h-full rounded-full bg-primary/50"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />
        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={handleMinChange}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
        />
        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>
    </div>
  )
}

// =============================================================================
// Date Range Selector Component
// =============================================================================

interface DateRangeSelectorProps {
  value: [Date | null, Date | null]
  onChange: (value: [Date | null, Date | null]) => void
}

function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [startDate, endDate] = value

  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null
    onChange([date, endDate])
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null
    onChange([startDate, date])
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={formatDateForInput(startDate)}
        onChange={handleStartChange}
        className="flex-1 px-2 py-1.5 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="From"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <input
        type="date"
        value={formatDateForInput(endDate)}
        onChange={handleEndChange}
        className="flex-1 px-2 py-1.5 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="To"
      />
    </div>
  )
}

// =============================================================================
// Filter Panel Component
// =============================================================================

interface FilterPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  onClear: () => void
  hasActiveFilters: boolean
  priceRange: [number, number] // actual min/max from events
}

function FilterPanel({
  filters,
  onFiltersChange,
  onClear,
  hasActiveFilters,
  priceRange,
}: FilterPanelProps) {
  return (
    <div className="p-4 rounded-xl border bg-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium lowercase">filters</span>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            clear
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground lowercase">price range</label>
        <PriceSlider
          min={priceRange[0]}
          max={priceRange[1]}
          value={filters.priceRange}
          onChange={(value) => onFiltersChange({ ...filters, priceRange: value })}
        />
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground lowercase">date range</label>
        <DateRangeSelector
          value={filters.dateRange}
          onChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
        />
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export const EventResultsGrid = memo(function EventResultsGrid({
  events,
  onSelect,
  className,
}: EventResultsGridProps) {
  const selectedEvent = useConversationStore(selectSelectedEvent)
  const selectEvent = useConversationStore((s) => s.selectEvent)

  // UI State
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filter State
  const [filters, setFilters] = useState<Filters>({
    priceRange: [PRICE_MIN, PRICE_MAX],
    dateRange: [null, null],
  })

  // Normalize events
  const normalizedEvents = useMemo(() => events.map(normalizeEvent), [events])

  // Calculate actual price range from events
  const actualPriceRange = useMemo((): [number, number] => {
    const prices = normalizedEvents
      .map((e) => e.price_min)
      .filter((p): p is number => p !== null)

    if (prices.length === 0) return [PRICE_MIN, PRICE_MAX]

    return [
      Math.max(PRICE_MIN, Math.min(...prices)),
      Math.min(PRICE_MAX, Math.max(...prices) + 50),
    ]
  }, [normalizedEvents])

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.priceRange[0] !== actualPriceRange[0] ||
      filters.priceRange[1] !== actualPriceRange[1] ||
      filters.dateRange[0] !== null ||
      filters.dateRange[1] !== null
    )
  }, [filters, actualPriceRange])

  // Apply filters
  const filteredEvents = useMemo(() => {
    return normalizedEvents.filter((event) => {
      // Price filter
      const price = event.price_min
      if (typeof price === 'number') {
        if (price < filters.priceRange[0]) return false
        if (price > filters.priceRange[1]) return false
      }

      // Date filter
      const eventDate = new Date(event.date)
      if (filters.dateRange[0] && eventDate < filters.dateRange[0]) return false
      if (filters.dateRange[1] && eventDate > filters.dateRange[1]) return false

      return true
    })
  }, [normalizedEvents, filters])

  // Determine how many to show
  const displayedEvents = isExpanded
    ? filteredEvents
    : filteredEvents.slice(0, INITIAL_DISPLAY_COUNT)

  const remainingCount = filteredEvents.length - INITIAL_DISPLAY_COUNT
  const hasMore = remainingCount > 0

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      priceRange: actualPriceRange,
      dateRange: [null, null],
    })
  }

  // Handle event selection
  const handleSelect = (event: Event) => {
    if (selectedEvent?.id === event.id) {
      selectEvent(null)
    } else {
      const selected: SelectedEvent = {
        id: event.id,
        name: event.name,
        date: event.date,
        venue: event.venue_name,
        city: event.venue_city,
        imageUrl: event.image_url ?? undefined,
        priceRange: event.price_min ? `from ${event.price_min}` : undefined,
        url: event.purchase_url ?? undefined,
      }
      selectEvent(selected)
      onSelect?.(selected)
    }
  }

  // Empty state
  if (!events || events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        no events found matching your search.
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          {hasActiveFilters ? (
            <>
              showing {filteredEvents.length} of {normalizedEvents.length} events
            </>
          ) : (
            <>
              found {normalizedEvents.length} event{normalizedEvents.length !== 1 ? 's' : ''}
            </>
          )}
        </p>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors",
            showFilters || hasActiveFilters
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <SlidersHorizontal className="w-3 h-3" />
          filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            priceRange={actualPriceRange}
          />
        </div>
      )}

      {/* No results after filtering */}
      {filteredEvents.length === 0 && (
        <div className="text-sm text-muted-foreground py-4 text-center">
          <p>no events match your filters.</p>
          <button
            onClick={handleClearFilters}
            className="text-primary hover:underline mt-1"
          >
            clear filters
          </button>
        </div>
      )}

      {/* Event Grid */}
      {filteredEvents.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {displayedEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                isSelected={selectedEvent?.id === event.id}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Show More / Show Less */}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-4 py-2.5 px-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  show {remainingCount} more event{remainingCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* Ticketmaster Attribution */}
      <p className="text-[10px] text-muted-foreground/50 mt-4 text-center">
        event data provided by ticketmaster
      </p>
    </div>
  )
})

// =============================================================================
// Helper Functions
// =============================================================================

function normalizeEvent(apiEvent: EventFromApi): Event {
  return {
    id: apiEvent.id,
    name: apiEvent.name,
    date: apiEvent.date,
    time: apiEvent.time ?? null,
    venue_name: apiEvent.venue_name ?? apiEvent.venue ?? 'Unknown Venue',
    venue_city: apiEvent.venue_city ?? apiEvent.city ?? 'Unknown City',
    venue_state: apiEvent.venue_state ?? apiEvent.state ?? null,
    image_url: apiEvent.image_url ?? null,
    price_min: apiEvent.price_min ?? null,
    price_max: null,
    currency: 'USD',
    purchase_url: apiEvent.ticket_url ?? apiEvent.purchase_url ?? apiEvent.url ?? null,
  }
}
