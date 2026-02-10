'use client'

import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EventStatusBadge } from '@/components/ui/badges'
import { formatShortDate, completionPct } from '@/lib/constants'
import type { EventWithCompletion } from '@/lib/types/database'

interface UpcomingEventsCardProps {
  events: EventWithCompletion[]
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No upcoming events</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/events">Create your first event</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/events">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="block p-3 -mx-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{event.name}</span>
                  <EventStatusBadge status={event.status} />
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatShortDate(event.date)}</span>
                  {event.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.venue}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">
                  {event.completed_deliverables}/{event.total_deliverables}
                </p>
                <p className="text-xs text-muted-foreground">
                  {completionPct(event.total_deliverables, event.completed_deliverables)}% complete
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${completionPct(event.total_deliverables, event.completed_deliverables)}%`,
                }}
              />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
