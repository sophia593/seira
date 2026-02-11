'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventStatusBadge } from '@/components/ui/badges'
import { CreateEventDialog } from '@/app/(app)/events/create-event-dialog'
import { formatEventDate } from '@/lib/constants'
import type { Event } from '@/lib/types/database'

interface EventListProps {
  events: Event[]
  orgId: string
}

export function EventList({ events, orgId }: EventListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div>
      {events.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No events yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create your first event to start tracking partner deliverables.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create your first event
          </Button>
        </div>
      ) : (
        <>
        <div className="flex justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          {events.map((event, i) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className={`flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                i < events.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              {/* Name + venue */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.name}</p>
                {event.venue && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5 sm:hidden">
                    {event.venue}
                  </p>
                )}
              </div>

              {/* Venue — desktop only */}
              {event.venue && (
                <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[160px]">
                  {event.venue}
                </span>
              )}

              {/* Date */}
              <span className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                {formatEventDate(event.date)}
              </span>

              {/* Status badge */}
              <EventStatusBadge status={event.status} showIcon={false} />
            </Link>
          ))}
        </div>
        </>
      )}

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
