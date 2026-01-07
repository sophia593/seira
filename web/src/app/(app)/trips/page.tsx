'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getApi, type Trip } from '@/lib/api'
import { TripList } from '@/components/trips/trip-list'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

type FilterType = 'all' | 'upcoming' | 'past'

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'upcoming', label: 'upcoming' },
  { value: 'past', label: 'past' },
]

// =============================================================================
// Main Page
// =============================================================================

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  useEffect(() => {
    async function fetchTrips() {
      try {
        const api = getApi()
        const data = await api.getTrips()
        setTrips(data)
      } catch (err) {
        console.error('Failed to fetch trips:', err)
        setError('failed to load trips')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrips()
  }, [])

  // Filter trips based on active filter
  const filteredTrips = useMemo(() => {
    if (activeFilter === 'all') return trips

    const upcomingStatuses = ['draft', 'quoted', 'booked']
    const pastStatuses = ['completed', 'cancelled']

    if (activeFilter === 'upcoming') {
      return trips.filter((t) => upcomingStatuses.includes(t.status || 'draft'))
    }
    if (activeFilter === 'past') {
      return trips.filter((t) => pastStatuses.includes(t.status || ''))
    }
    return trips
  }, [trips, activeFilter])

  // Count for each filter
  const counts = useMemo(() => {
    const upcomingStatuses = ['draft', 'quoted', 'booked']
    const pastStatuses = ['completed', 'cancelled']
    return {
      all: trips.length,
      upcoming: trips.filter((t) => upcomingStatuses.includes(t.status || 'draft')).length,
      past: trips.filter((t) => pastStatuses.includes(t.status || '')).length,
    }
  }, [trips])

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-page-title">trips</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
              your upcoming and past travel plans
            </p>
          </div>
          <Button asChild className="lowercase w-full sm:w-auto">
            <Link href="/chat?prompt=help%20me%20plan%20a%20trip%20to">
              <Plus className="w-4 h-4 mr-2" />
              plan a trip
            </Link>
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full transition-colors',
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
              )}
            >
              {filter.label}
              {!isLoading && (
                <span className="ml-1 sm:ml-1.5 opacity-70">({counts[filter.value]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <TripList
          trips={filteredTrips}
          isLoading={isLoading}
          error={error}
          showGrouping={activeFilter === 'all'}
          emptyMessage={
            activeFilter !== 'all' && trips.length > 0
              ? `no ${activeFilter} trips yet`
              : undefined
          }
        />
      </div>
    </div>
  )
}
