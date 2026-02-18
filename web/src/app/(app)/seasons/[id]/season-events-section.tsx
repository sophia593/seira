'use client'

import Link from 'next/link'
import { CalendarDays, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatShortDate, EVENT_DOT_COLOR } from '@/lib/constants'
import type { EventStatus, EventWithCompletion } from '@/lib/types/database'

type EventListItem = EventWithCompletion & { partner_count: number }

interface SeasonEventsSectionProps {
  events: EventListItem[]
}

export function SeasonEventsSection({ events }: SeasonEventsSectionProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">No events in this season</p>
        <p className="text-xs text-muted-foreground mt-1">
          Assign events to this season from the event create or edit form.
        </p>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-sm font-semibold mb-3">
        Events
        <span className="text-gray-300 font-normal ml-2">{events.length}</span>
      </h2>

      <div className="divide-y divide-gray-100">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            {/* Status dot + name + venue/date */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full shrink-0', EVENT_DOT_COLOR[event.status as EventStatus])} />
                <span className="text-sm font-medium text-gray-900 truncate">{event.name}</span>
              </div>
              {(event.venue || event.date) && (
                <p className="text-xs text-gray-400 mt-0.5 pl-4">
                  {[event.venue, event.date ? formatShortDate(event.date) : null].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Meta */}
            <span className="hidden sm:block text-xs text-gray-300 whitespace-nowrap shrink-0">
              {event.partner_count} partner{event.partner_count !== 1 ? 's' : ''} · {event.total_deliverables} deliverable{event.total_deliverables !== 1 ? 's' : ''}
            </span>

            {/* Progress */}
            {event.total_deliverables > 0 ? (
              <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5">
                <ProgressBar value={event.completion_pct} size="sm" className="w-24" />
                {event.overdue_count > 0 && (
                  <span className="text-xs text-red-400">{event.overdue_count} overdue</span>
                )}
                {(event.needs_proof_count ?? 0) > 0 && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {event.needs_proof_count} need proof
                  </span>
                )}
              </div>
            ) : (
              <div className="hidden sm:block w-[8.5rem] shrink-0" />
            )}
          </Link>
        ))}
      </div>
    </>
  )
}
