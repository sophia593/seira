'use client'

import { memo } from 'react'
import { EventCard } from '../event-card'
import { type Event } from '@/types/event'
import {
  useConversationStore,
  selectSelectedEvent,
  type SelectedEvent,
} from '@/stores/conversation-store'

// =============================================================================
// Types
// =============================================================================

/**
 * Event shape from API response (may differ from our Event type)
 * Maps to the shared Event type for display
 */
interface EventFromApi {
  id: string
  name: string
  date: string
  time?: string
  venue?: string
  venue_name?: string
  city?: string
  venue_city?: string
  state?: string
  venue_state?: string
  image_url?: string
  price_range?: string
  price_min?: number
  url?: string
  purchase_url?: string
}

interface EventResultsGridProps {
  events: EventFromApi[]
  onSelect?: (event: SelectedEvent) => void
  className?: string
}

// =============================================================================
// Main Component
// =============================================================================

export const EventResultsGrid = memo(function EventResultsGrid({
  events,
  onSelect,
  className,
}: EventResultsGridProps) {
  const selectedEvent = useConversationStore(selectSelectedEvent)
  const selectEvent = useConversationStore((s) => s.selectEvent)

  if (!events || events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        no events found matching your search.
      </div>
    )
  }

  const handleSelect = (event: Event) => {
    // Toggle selection
    if (selectedEvent?.id === event.id) {
      selectEvent(null)
    } else {
      const selected: SelectedEvent = {
        id: event.id,
        name: event.name,
        date: event.date,
        venue: event.venue_name,
        city: event.venue_city,
        imageUrl: event.image_url ?? undefined,
        priceRange: event.price_min ? `from $${event.price_min}` : undefined,
        url: event.purchase_url,
      }
      selectEvent(selected)
      // Call parent callback for auto-message
      onSelect?.(selected)
    }
  }

  // Convert API events to our Event type
  const normalizedEvents = events.map(normalizeEvent)

  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-3">
        found {events.length} event{events.length !== 1 ? 's' : ''}. click to select:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {normalizedEvents.slice(0, 6).map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            index={index}
            isSelected={selectedEvent?.id === event.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
      {events.length > 6 && (
        <p className="text-xs text-muted-foreground mt-3">
          +{events.length - 6} more events
        </p>
      )}
    </div>
  )
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize API event response to our Event type
 * Handles variations in field names from different API responses
 */
function normalizeEvent(apiEvent: EventFromApi): Event {
  return {
    id: apiEvent.id,
    name: apiEvent.name,
    date: apiEvent.date,
    time: apiEvent.time ?? null,
    venue_name: apiEvent.venue_name ?? apiEvent.venue ?? 'Unknown Venue',
    venue_city: apiEvent.venue_city ?? apiEvent.city ?? 'Unknown City',
    venue_state: apiEvent.venue_state ?? apiEvent.state ?? null,
    image_url: apiEvent.image_url ?? null,
    price_min: apiEvent.price_min ?? null,
    price_max: null,
    currency: 'USD',
    purchase_url: apiEvent.purchase_url ?? apiEvent.url ?? '#',
  }
}
