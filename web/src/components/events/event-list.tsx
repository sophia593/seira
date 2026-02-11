'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateEventDialog } from '@/app/(app)/events/create-event-dialog'
import { formatEventDate } from '@/lib/constants'
import type { Event, EventStatus } from '@/lib/types/database'

// =============================================================================
// Status Dot Colors
// =============================================================================

const STATUS_DOT: Record<EventStatus, string> = {
  upcoming: 'bg-copper',
  active: 'bg-green-500',
  completed: 'bg-gray-300',
  archived: 'bg-gray-200',
}

// =============================================================================
// Component
// =============================================================================

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
          <button
            onClick={() => setShowCreateDialog(true)}
            className="bg-kurobeni text-white text-sm rounded-md h-9 px-4 hover:bg-blackberry transition-colors"
          >
            + new event
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="bg-kurobeni text-white text-sm rounded-md h-9 px-4 hover:bg-blackberry transition-colors"
            >
              + new event
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Status dot */}
                <span className={cn('h-2 w-2 rounded-full shrink-0', STATUS_DOT[event.status])} />

                {/* Name */}
                <span className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
                  {event.name}
                </span>

                {/* Venue — hidden on mobile */}
                {event.venue && (
                  <span className="hidden sm:block text-sm text-gray-400 truncate max-w-[200px]">
                    {event.venue}
                  </span>
                )}

                {/* Date */}
                <span className="hidden sm:block text-sm text-gray-400 tabular-nums whitespace-nowrap">
                  {formatEventDate(event.date)}
                </span>
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
