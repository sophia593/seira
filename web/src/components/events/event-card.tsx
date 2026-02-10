'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EventStatusBadge } from '@/components/ui/badges'
import { formatEventDate } from '@/lib/constants'
import type { Event } from '@/lib/types/database'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-base truncate">{event.name}</h3>
            <EventStatusBadge status={event.status} />
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {formatEventDate(event.date)}
            </p>
            {event.venue && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{event.venue}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
