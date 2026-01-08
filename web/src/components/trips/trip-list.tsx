'use client'

import Link from 'next/link'
import { Plus, Plane } from 'lucide-react'
import { type Trip } from '@/lib/api'
import { TripCard } from './trip-card'
import { TripListSkeleton } from './trip-card-skeleton'
import { Button } from '@/components/ui/button'

// =============================================================================
// Types
// =============================================================================

interface TripListProps {
  trips: Trip[]
  isLoading?: boolean
  error?: string | null
  showGrouping?: boolean
  /** When filtering, show a lighter empty state */
  emptyMessage?: string
  /** Callback for retry button in error state */
  onRetry?: () => void
}

// =============================================================================
// Main Component
// =============================================================================

export function TripList({ trips, isLoading, error, showGrouping = true, emptyMessage, onRetry }: TripListProps) {
  if (isLoading) {
    return <TripListSkeleton count={4} />
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (trips.length === 0) {
    // If we have a custom message, show the lighter filtered empty state
    if (emptyMessage) {
      return <FilteredEmptyState message={emptyMessage} />
    }
    return <EmptyState />
  }

  if (showGrouping) {
    return <GroupedTripList trips={trips} />
  }

  // Simple grid without grouping
  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  )
}

// =============================================================================
// Grouped Trip List
// =============================================================================

function GroupedTripList({ trips }: { trips: Trip[] }) {
  // Group trips by status
  const activeTrips = trips.filter(
    (t) => t.status === 'draft' || t.status === 'quoted' || t.status === 'booked'
  )
  const pastTrips = trips.filter(
    (t) => t.status === 'completed' || t.status === 'cancelled'
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <section>
          <h2 className="text-base sm:text-section-title mb-3 sm:mb-4">upcoming</h2>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {activeTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Past Trips */}
      {pastTrips.length > 0 && (
        <section>
          <h2 className="text-base sm:text-section-title mb-3 sm:mb-4">past</h2>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {pastTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// =============================================================================
// Empty State
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

// =============================================================================
// Filtered Empty State (lighter, for tab filters)
// =============================================================================

function FilteredEmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-sm">
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
