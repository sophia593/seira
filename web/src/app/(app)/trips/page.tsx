'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getApi, type Trip } from '@/lib/api'
import { TripList } from '@/components/trips/trip-list'
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
        <TripList trips={trips} isLoading={isLoading} error={error} />
      </div>
    </div>
  )
}
