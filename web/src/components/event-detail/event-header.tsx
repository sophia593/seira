'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventStatusBadge } from '@/components/ui/badges'
import { formatEventDate, completionPct } from '@/lib/constants'
import type { EventWithCompletion } from '@/lib/types/database'

interface EventHeaderProps {
  event: EventWithCompletion
}

export function EventHeader({ event }: EventHeaderProps) {
  const completion = completionPct(event.total_deliverables, event.completed_deliverables)

  return (
    <div>
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/events">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Events
        </Link>
      </Button>

      {/* Title and status */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-semibold">{event.name}</h1>
            <EventStatusBadge status={event.status} />
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatEventDate(event.date)}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.venue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Completion bar */}
      <div className="mt-6 p-4 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {event.completed_deliverables} of {event.total_deliverables} deliverables completed
          </span>
          <span className="text-sm font-medium">{completion}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>
    </div>
  )
}
