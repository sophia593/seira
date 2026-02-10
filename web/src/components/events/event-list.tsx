'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventCard } from './event-card'
import { EventFilters } from './event-filters'
import { EventFormDialog } from './event-form-dialog'
import type { EventStatus, EventWithCompletion } from '@/lib/types/database'

interface EventListProps {
  events: EventWithCompletion[]
  orgId: string
}

export function EventList({ events, orgId }: EventListProps) {
  const [filter, setFilter] = useState<EventStatus | 'all'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events
    return events.filter((e) => e.status === filter)
  }, [events, filter])

  // Count events by status
  const counts = useMemo(() => {
    const result: Record<EventStatus | 'all', number> = {
      all: events.length,
      upcoming: 0,
      active: 0,
      completed: 0,
      archived: 0,
    }
    events.forEach((e) => {
      result[e.status]++
    })
    return result
  }, [events])

  return (
    <div>
      {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <EventFilters value={filter} onChange={setFilter} counts={counts} />
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {/* Events grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {filter === 'all' ? (
            <>
              <p>No events yet</p>
              <p className="text-sm mt-1">Create your first event to get started</p>
            </>
          ) : (
            <p>No {filter} events</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <EventFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        orgId={orgId}
      />
    </div>
  )
}
