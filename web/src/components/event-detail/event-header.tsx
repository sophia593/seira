'use client'

import { MapPin, Calendar } from 'lucide-react'
import { EventStatusBadge } from '@/components/ui/badges'
import { formatEventDate } from '@/lib/constants'
import type { Event } from '@/lib/types/database'

interface EventHeaderProps {
  event: Event
}

export function EventHeader({ event }: EventHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl md:text-3xl font-semibold">{event.name}</h1>
        <EventStatusBadge status={event.status} />
      </div>

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

      {event.notes && (
        <p className="mt-3 text-sm text-muted-foreground">{event.notes}</p>
      )}
    </div>
  )
}
