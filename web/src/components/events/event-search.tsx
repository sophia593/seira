'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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
// Helpers
// =============================================================================

function buildSearchParams(
  cat: CategoryId, q: string, c: string, from: string, to: string
): EventSearchParams {
  const config = EVENT_CATEGORIES.find(x => x.id === cat)
  const params: EventSearchParams = { size: 40 }
  if (q) params.q = q
  if (c) params.city = c
  if (from) params.dateFrom = from
  if (to) params.dateTo = to
  if (config?.segment) params.segment = config.segment
  if (config?.genre) params.genre = config.genre
  // "All" with no other filters → show featured
  if (cat === 'all' && !q && !c && !from) {
    params.segment = 'Music'
  }
  return params
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

  // Search form state
  const [category, setCategory] = useState<CategoryId>(defaultCategory || 'all')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Track if we've searched
  const [hasSearched, setHasSearched] = useState(false)

  // Debounce refs
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isInitialMount = useRef(true)

  // Restore form state from URL and auto-search on mount
  useEffect(() => {
    const urlQ = searchParams.get('q') || ''
    const urlCity = searchParams.get('city') || ''
    const urlFrom = searchParams.get('from') || ''
    const urlTo = searchParams.get('to') || ''
    const urlCat = (searchParams.get('category') as CategoryId) || defaultCategory || 'all'

    if (urlQ) setQuery(urlQ)
    if (urlCity) setCity(urlCity)
    if (urlFrom) setDateFrom(urlFrom)
    if (urlTo) setDateTo(urlTo)
    if (urlCat !== 'all') setCategory(urlCat)

    const params = buildSearchParams(urlCat, urlQ, urlCity, urlFrom, urlTo)
    search(params)
    setHasSearched(true)
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced live search when text inputs change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      syncUrl(category, query, city, dateFrom, dateTo)
      const params = buildSearchParams(category, query, city, dateFrom, dateTo)
      search(params)
      setHasSearched(true)
    }, 350)

    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, city, dateFrom, dateTo])

  const syncUrl = useCallback((
    cat: CategoryId, q: string, c: string, from: string, to: string
  ) => {
    const params = new URLSearchParams()
    if (cat !== 'all') params.set('category', cat)
    if (q) params.set('q', q)
    if (c) params.set('city', c)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(url, { scroll: false })
  }, [router])

  const handleCategoryChange = useCallback((newCategory: CategoryId) => {
    clearTimeout(debounceRef.current)
    setCategory(newCategory)
    syncUrl(newCategory, query, city, dateFrom, dateTo)
    const params = buildSearchParams(newCategory, query, city, dateFrom, dateTo)
    search(params)
    setHasSearched(true)
  }, [query, city, dateFrom, dateTo, search, syncUrl])

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    clearTimeout(debounceRef.current)

    if (!query && !city && !dateFrom && category === 'all') return

    syncUrl(category, query, city, dateFrom, dateTo)
    const params = buildSearchParams(category, query, city, dateFrom, dateTo)
    await search(params)
    setHasSearched(true)
  }, [query, city, dateFrom, dateTo, category, search, syncUrl])

  const handleClear = useCallback(() => {
    clearTimeout(debounceRef.current)
    setQuery('')
    setCity('')
    setDateFrom('')
    setDateTo('')
    setCategory('all')
    clear()
    setHasSearched(false)
    router.push(window.location.pathname, { scroll: false })
  }, [clear, router])

  const hasFilters = query || city || dateFrom || dateTo || category !== 'all'

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Tabs */}
      <div className="flex gap-1 -mx-4 px-4 overflow-x-auto sm:mx-0 sm:px-0 sm:overflow-visible border-b">
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            aria-pressed={category === cat.id}
            className={cn(
              'relative min-h-[44px] px-4 py-2.5 text-sm whitespace-nowrap transition-colors',
              category === cat.id
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            )}
          >
            {cat.label}
            {category === cat.id && (
              <span className="absolute inset-x-1 bottom-0 h-0.5 bg-foreground rounded-full" />
            )}
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
            aria-label="Search for an artist, team, or event"
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
              aria-label="City"
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
              aria-label="Date from"
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
              aria-label="Date to"
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
        <div className="space-y-4" aria-live="polite">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {isLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              )}
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
            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-150",
              isLoading && "opacity-60 pointer-events-none"
            )}>
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
          {results.events.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No events match your search</p>
              <p className="text-sm text-muted-foreground">
                Try different keywords, dates, or location
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton (initial load only) */}
      {!results && isLoading && (
        <div className="space-y-4">
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card overflow-hidden animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
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
