'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Plane } from 'lucide-react'
import { getApi, type Trip } from '@/lib/api'
import { TripCard } from '@/components/trips/trip-card'
import { TripListSkeleton } from '@/components/trips/trip-card-skeleton'
import { Button } from '@/components/ui/button'

// =============================================================================
// Main Page
// =============================================================================

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-page-title">trips</h1>
            <p className="text-muted-foreground mt-1">
              your upcoming and past travel plans
            </p>
          </div>
          <Button asChild className="lowercase">
            <Link href="/chat">
              <Plus className="w-4 h-4 mr-2" />
              plan a trip
            </Link>
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <TripListSkeleton count={4} />
        ) : error ? (
          <ErrorState message={error} />
        ) : trips.length === 0 ? (
          <EmptyState />
        ) : (
          <TripList trips={trips} />
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Trip List
// =============================================================================

function TripList({ trips }: { trips: Trip[] }) {
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
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Plane className="w-8 h-8 text-muted-foreground" />
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
