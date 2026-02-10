'use client'

import Link from 'next/link'
import { MapPin, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EventStatusBadge } from '@/components/ui/badges'
import { formatEventDate, completionPct } from '@/lib/constants'
import type { EventWithCompletion } from '@/lib/types/database'

interface EventCardProps {
  event: EventWithCompletion
}

export function EventCard({ event }: EventCardProps) {
  const completion = completionPct(event.total_deliverables, event.completed_deliverables)
  const hasOverdue = event.overdue_count > 0

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="pt-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-base truncate">{event.name}</h3>
            <EventStatusBadge status={event.status} />
          </div>

          {/* Date and venue */}
          <div className="space-y-1 mb-4">
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

          {/* Completion stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {event.completed_deliverables}/{event.total_deliverables} deliverables
              </span>
              <span className="font-medium">{completion}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>

            {/* Overdue indicator */}
            {hasOverdue && (
              <div className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{event.overdue_count} overdue</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
