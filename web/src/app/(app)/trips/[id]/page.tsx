'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getApi, type TripDetail } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { TripDetailComponent } from '@/components/trips/trip-detail'

// =============================================================================
// Main Page
// =============================================================================

export default function TripDetailPage() {
  const params = useParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrip() {
      try {
        const api = getApi()
        const data = await api.getTrip(tripId)
        setTrip(data)
      } catch (err) {
        console.error('Failed to fetch trip:', err)
        setError('failed to load trip')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [tripId])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !trip) {
    return <ErrorState message={error || 'trip not found'} />
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Back link */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          back to trips
        </Link>

        {/* Trip Detail Component */}
        <TripDetailComponent trip={trip} />
      </div>
    </div>
  )
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="animate-pulse space-y-6">
          {/* Back link */}
          <div className="h-4 w-24 bg-muted rounded" />

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-8 w-2/3 bg-muted rounded" />
                <div className="h-4 w-1/3 bg-muted rounded" />
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
            <div className="h-20 bg-muted rounded-xl" />
          </div>

          {/* Event card */}
          <div className="h-64 bg-muted rounded-2xl" />

          {/* Flight & Hotel */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Error State
// =============================================================================

function ErrorState({ message }: { message: string }) {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          back to trips
        </Link>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-4">{message}</p>
          <Button asChild variant="outline" className="lowercase">
            <Link href="/trips">return to trips</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
