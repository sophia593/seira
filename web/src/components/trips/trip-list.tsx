'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Plane, Search, X } from 'lucide-react'
import { type Trip } from '@/lib/api'
import { TripCard } from './trip-card'
import { TripListSkeleton } from './trip-card-skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface TripListProps {
  trips: Trip[]
  isLoading?: boolean
  error?: string | null
  showSearch?: boolean
  emptyMessage?: string
  onRetry?: () => void
}

// =============================================================================
// Date Helpers
// =============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

// =============================================================================
// Search Component
// =============================================================================

function TripSearch({
  value,
  onChange
}: {
  value: string
  onChange: (search: string) => void
}) {
  return (
    <div className="relative mb-4 sm:mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="search trips..."
        className="w-full pl-9 pr-9 py-2.5 text-sm border rounded-lg bg-background lowercase placeholder:lowercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// =============================================================================
// Filter Function
// =============================================================================

function filterTrips(trips: Trip[], search: string): Trip[] {
  if (!search.trim()) return trips

  const query = search.toLowerCase()
  return trips.filter(trip =>
    trip.title?.toLowerCase().includes(query) ||
    trip.event_name?.toLowerCase().includes(query) ||
    trip.destination_city?.toLowerCase().includes(query)
  )
}

// =============================================================================
// Date Grouping
// =============================================================================

interface TripGroups {
  thisWeek: Trip[]
  thisMonth: Trip[]
  later: Trip[]
  past: Trip[]
  noDates: Trip[]
}

function groupTripsByDate(trips: Trip[]): TripGroups {
  const now = startOfDay(new Date())
  const nextWeek = addDays(now, 7)
  const nextMonth = addMonths(now, 1)

  const groups: TripGroups = {
    thisWeek: [],
    thisMonth: [],
    later: [],
    past: [],
    noDates: [],
  }

  for (const trip of trips) {
    // Check if trip is past by status first
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      groups.past.push(trip)
      continue
    }

    // No event date - put in noDates
    if (!trip.event_date) {
      groups.noDates.push(trip)
      continue
    }

    const eventDate = startOfDay(new Date(trip.event_date))

    if (eventDate < now) {
      groups.past.push(trip)
    } else if (eventDate < nextWeek) {
      groups.thisWeek.push(trip)
    } else if (eventDate < nextMonth) {
      groups.thisMonth.push(trip)
    } else {
      groups.later.push(trip)
    }
  }

  // Sort each group by event date (soonest first)
  const sortByDate = (a: Trip, b: Trip) => {
    const dateA = a.event_date ? new Date(a.event_date).getTime() : 0
    const dateB = b.event_date ? new Date(b.event_date).getTime() : 0
    return dateA - dateB
  }

  groups.thisWeek.sort(sortByDate)
  groups.thisMonth.sort(sortByDate)
  groups.later.sort(sortByDate)
  groups.past.sort((a, b) => sortByDate(b, a)) // Most recent past first

  return groups
}

// =============================================================================
// Trip Group Component
// =============================================================================

function TripGroup({
  title,
  trips,
  urgent,
  muted
}: {
  title: string
  trips: Trip[]
  urgent?: boolean
  muted?: boolean
}) {
  if (trips.length === 0) return null

  return (
    <section className="mb-6 sm:mb-8 last:mb-0">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <h2 className={cn(
          "text-sm sm:text-base font-medium lowercase",
          urgent && "text-orange-600 dark:text-orange-500",
          muted && "text-muted-foreground"
        )}>
          {title}
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {trips.length}
        </span>
        {urgent && (
          <span className="text-xs text-orange-600 dark:text-orange-500">
            • coming up soon
          </span>
        )}
      </div>
      <div className={cn(
        "grid gap-3 sm:gap-4 sm:grid-cols-2",
        muted && "opacity-70"
      )}>
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </section>
  )
}

// =============================================================================
// Grouped Trip List
// =============================================================================

function GroupedTripList({ trips }: { trips: Trip[] }) {
  const groups = useMemo(() => groupTripsByDate(trips), [trips])

  const hasUpcoming = groups.thisWeek.length > 0 ||
                      groups.thisMonth.length > 0 ||
                      groups.later.length > 0 ||
                      groups.noDates.length > 0

  return (
    <div>
      {/* Upcoming trips */}
      <TripGroup
        title="this week"
        trips={groups.thisWeek}
        urgent
      />
      <TripGroup
        title="this month"
        trips={groups.thisMonth}
      />
      <TripGroup
        title="coming up"
        trips={groups.later}
      />
      <TripGroup
        title="drafts"
        trips={groups.noDates}
      />

      {/* Past trips - only show if there are also upcoming */}
      {groups.past.length > 0 && (
        <>
          {hasUpcoming && (
            <div className="border-t my-6 sm:my-8" />
          )}
          <TripGroup
            title="past trips"
            trips={groups.past}
            muted
          />
        </>
      )}
    </div>
  )
}

// =============================================================================
// Empty States
// =============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
        <Plane className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
      </div>
      <h3 className="text-base sm:text-lg font-medium mb-2 lowercase">no trips yet</h3>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-sm">
        start planning your first trip by chatting with seira about an event you want to attend.
      </p>
      <Button asChild className="lowercase w-full sm:w-auto">
        <Link href="/chat?prompt=help%20me%20plan%20a%20trip%20to">
          <Plus className="w-4 h-4 mr-2" />
          plan your first trip
        </Link>
      </Button>
    </div>
  )
}

function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground text-sm lowercase">
        no trips found for "{query}"
      </p>
    </div>
  )
}

function FilteredEmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-sm lowercase">
      {message}
    </div>
  )
}

// =============================================================================
// Error State
// =============================================================================

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-destructive mb-4">{message}</p>
      <Button
        variant="outline"
        onClick={onRetry ?? (() => window.location.reload())}
        className="lowercase"
      >
        try again
      </Button>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function TripList({
  trips,
  isLoading,
  error,
  showSearch = true,
  emptyMessage,
  onRetry
}: TripListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter trips by search
  const filteredTrips = useMemo(
    () => filterTrips(trips, searchQuery),
    [trips, searchQuery]
  )

  if (isLoading) {
    return <TripListSkeleton count={4} />
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (trips.length === 0) {
    if (emptyMessage) {
      return <FilteredEmptyState message={emptyMessage} />
    }
    return <EmptyState />
  }

  return (
    <div>
      {/* Search */}
      {showSearch && trips.length > 2 && (
        <TripSearch value={searchQuery} onChange={setSearchQuery} />
      )}

      {/* Results */}
      {filteredTrips.length === 0 ? (
        <SearchEmptyState query={searchQuery} />
      ) : (
        <GroupedTripList trips={filteredTrips} />
      )}
    </div>
  )
}
