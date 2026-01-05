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
}

// =============================================================================
// Main Component
// =============================================================================

export function TripList({ trips, isLoading, error, showGrouping = true }: TripListProps) {
  if (isLoading) {
    return <TripListSkeleton count={4} />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (trips.length === 0) {
    return <EmptyState />
  }

  if (showGrouping) {
    return <GroupedTripList trips={trips} />
  }

  // Simple grid without grouping
  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
    <div className="space-y-8">
      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <section>
          <h2 className="text-section-title mb-4">upcoming</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Past Trips */}
      {pastTrips.length > 0 && (
        <section>
          <h2 className="text-section-title mb-4">past</h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Plane className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2 lowercase">no trips yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        start planning your first trip by chatting with seira about an event you want to attend.
      </p>
      <Button asChild className="lowercase">
        <Link href="/chat">
          <Plus className="w-4 h-4 mr-2" />
          plan your first trip
        </Link>
      </Button>
    </div>
  )
}

// =============================================================================
// Error State
// =============================================================================

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-destructive mb-4">{message}</p>
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="lowercase"
      >
        try again
      </Button>
    </div>
  )
}
