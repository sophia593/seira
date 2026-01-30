'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { EventSearch } from '@/components/events'
import { getApi } from '@/lib/api'
import { toast } from '@/components/ui/sonner'
import type { EventResult, Showtime } from '@/hooks/use-event-search'

// Lazy load the detail drawer (only needed on event click)
const EventDetailDrawer = dynamic(
  () => import('@/components/events/event-detail-drawer').then((mod) => ({ default: mod.EventDetailDrawer })),
  { ssr: false }
)

export default function SearchPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventResult | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Open drawer when event card is clicked
  const handleEventClick = (event: EventResult) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  // Close drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    // Small delay to allow animation before clearing event
    setTimeout(() => {
      if (!isCreating) {
        setSelectedEvent(null)
      }
    }, 300)
  }

  // Confirm selection and create trip
  const handleConfirmSelection = async (event: EventResult, showtime: Showtime) => {
    if (isCreating) return

    setIsCreating(true)

    try {
      const api = getApi()

      // Create trip with event data + selected showtime
      const trip = await api.createTrip({
        title: event.name,
        destination_city: event.venue?.city ?? undefined,
        event_name: event.name,
        event_date: showtime.date,
        event_time: showtime.time,
        event_provider: event.provider,
        event_provider_id: event.provider_id,
        event_venue: event.venue?.name ?? undefined,
        event_venue_address: event.venue?.address ?? undefined,
        event_price_estimate: event.price_range?.min ?? undefined,
        event_purchase_url: event.purchase_url,
      })

      // Close drawer and navigate to trip builder
      setIsDrawerOpen(false)
      router.push(`/trip/${trip.id}`)
    } catch (error) {
      console.error('Failed to create trip:', error)
      toast.error('failed to create trip. please try again.')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 lowercase">find your event</h1>
          <p className="text-muted-foreground">
            search for concerts, sports, theater, and more
          </p>
        </div>

        {/* Creating overlay */}
        {isCreating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center" role="status" aria-live="assertive">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-lg font-medium">creating your trip...</p>
            </div>
          </div>
        )}

        {/* Search Component */}
        <EventSearch
          onEventSelect={handleEventClick}
          selectedEventId={selectedEvent?.id}
        />

        {/* Event Detail Drawer */}
        <EventDetailDrawer
          event={selectedEvent}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onConfirm={handleConfirmSelection}
          isLoading={isCreating}
        />
      </div>
    </div>
  )
}
