'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2, Calendar, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useEventSearch, type EventResult, type EventSearchParams } from '@/hooks/use-event-search'
import { EventCard } from './event-card'

// =============================================================================
// Category Config
// =============================================================================

export const EVENT_CATEGORIES = [
  { id: 'all', label: 'All', segment: undefined, genre: undefined },
  { id: 'nba', label: 'NBA', segment: 'Sports', genre: 'Basketball' },
  { id: 'nfl', label: 'NFL', segment: 'Sports', genre: 'Football' },
  { id: 'mlb', label: 'MLB', segment: 'Sports', genre: 'Baseball' },
  { id: 'nhl', label: 'NHL', segment: 'Sports', genre: 'Hockey' },
  { id: 'soccer', label: 'Soccer', segment: 'Sports', genre: 'Soccer' },
  { id: 'concerts', label: 'Concerts', segment: 'Music', genre: undefined },
  { id: 'theater', label: 'Theater', segment: 'Arts & Theatre', genre: undefined },
  { id: 'comedy', label: 'Comedy', segment: 'Arts & Theatre', genre: 'Comedy' },
] as const

export type CategoryId = typeof EVENT_CATEGORIES[number]['id']

// =============================================================================
// Types
// =============================================================================

interface EventSearchProps {
  onEventSelect?: (event: EventResult) => void
  selectedEventId?: string
  className?: string
  defaultCategory?: CategoryId
}

// =============================================================================
// Component
// =============================================================================

export function EventSearch({
  onEventSelect,
  selectedEventId,
  className,
  defaultCategory,
}: EventSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { search, results, isLoading, error, clear } = useEventSearch()

  // Get category from URL or default
  const urlCategory = searchParams.get('category') as CategoryId | null
  const initialCategory = urlCategory || defaultCategory || 'all'

  // Search form state
  const [category, setCategory] = useState<CategoryId>(initialCategory)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Track if we've searched
  const [hasSearched, setHasSearched] = useState(false)

  // Auto-load featured events on initial render
  useEffect(() => {
    async function loadFeaturedEvents() {
      // Only load featured events if no filters are set
      if (!hasSearched && !urlCategory) {
        const params: EventSearchParams = {
          size: 12,
          segment: 'Music', // Show concerts by default as they're most popular
        }
        await search(params)
        setHasSearched(true)
      }
    }
    loadFeaturedEvents()
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync category from URL changes
  useEffect(() => {
    if (urlCategory && urlCategory !== category) {
      setCategory(urlCategory)
    }
  }, [urlCategory])

  const updateUrlCategory = useCallback((newCategory: CategoryId) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newCategory === 'all') {
      params.delete('category')
    } else {
      params.set('category', newCategory)
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newUrl, { scroll: false })
  }, [router, searchParams])

  const handleCategoryChange = useCallback((newCategory: CategoryId) => {
    setCategory(newCategory)
    updateUrlCategory(newCategory)
    // Clear results when category changes
    clear()
    setHasSearched(false)
  }, [updateUrlCategory, clear])

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    // For category searches, we need at least category OR query/city/date
    const categoryConfig = EVENT_CATEGORIES.find(c => c.id === category)
    const hasCategory = category !== 'all'

    if (!query && !city && !dateFrom && !hasCategory) {
      return
    }

    const params: EventSearchParams = {
      size: 20,
    }

    if (query) params.q = query
    if (city) params.city = city
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo

    // Add category filters
    if (categoryConfig?.segment) params.segment = categoryConfig.segment
    if (categoryConfig?.genre) params.genre = categoryConfig.genre

    await search(params)
    setHasSearched(true)
  }, [query, city, dateFrom, dateTo, category, search])

  const handleClear = useCallback(() => {
    setQuery('')
    setCity('')
    setDateFrom('')
    setDateTo('')
    clear()
    setHasSearched(false)
  }, [clear])

  const hasFilters = query || city || dateFrom || dateTo || category !== 'all'

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 -mx-4 px-4 overflow-x-auto pb-1 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0">
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={cn(
              'min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              category === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Main search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="search for an artist, team, or event..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3">
          {/* City */}
          <div className="relative flex-1 min-w-[150px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date from */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-10 w-[160px]"
            />
          </div>

          {/* Date to */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="pl-10 w-[160px]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isLoading || !hasFilters}
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
                Search Events
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
                'no events found'
              ) : !query && !city && !dateFrom && category === 'all' ? (
                <>
                  <span className="font-medium text-foreground">featured events</span> · {results.totalCount} available
                </>
              ) : (
                <>
                  found <span className="font-medium text-foreground">{results.totalCount}</span> event{results.totalCount !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>

          {/* Results grid */}
          {results.events.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={onEventSelect}
                  selected={selectedEventId === event.id}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {results.events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No events match your search</p>
              <p className="text-sm text-muted-foreground">
                Try different keywords, dates, or location
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {!results && isLoading && (
        <div className="space-y-4">
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card overflow-hidden animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="aspect-[16/9] bg-muted" />
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3.5 w-1/2 bg-muted rounded" />
                  <div className="h-3.5 w-2/3 bg-muted rounded" />
                  <div className="flex justify-between pt-2 border-t border-border/50">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
