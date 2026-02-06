"use client"

import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Music,
  Drama,
  Film,
  PartyPopper,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Event, PlanOrigin, EventCategory } from "@/lib/types"

interface EventAnchorProps {
  event: Event
  origin: PlanOrigin
  className?: string
}

const categoryConfig: Record<
  EventCategory,
  { icon: typeof Ticket; label: string }
> = {
  sports: { icon: Ticket, label: "sports" },
  music: { icon: Music, label: "music" },
  theater: { icon: Drama, label: "theater" },
  festival: { icon: PartyPopper, label: "festival" },
  film: { icon: Film, label: "film" },
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "pm" : "am"
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m} ${ampm}`
}

export function EventAnchor({ event, origin, className }: EventAnchorProps) {
  const cat = categoryConfig[event.category]
  const CatIcon = cat.icon

  return (
    <section className={cn("relative", className)}>
      {/* Category badge */}
      <div className="flex items-center gap-6 mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground/70 text-xs font-medium lowercase tracking-tight">
          <CatIcon className="h-3 w-3 stroke-[1.5]" />
          {cat.label}
        </span>
      </div>

      {/* Event name: largest text on the page */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold lowercase tracking-tight leading-[1.05] mb-8 max-w-3xl text-balance">
        {event.name}
      </h1>

      {/* Date + time + venue row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap sm:gap-x-8 sm:gap-y-3 mb-8">
        {/* Date */}
        <div className="flex items-center gap-2.5 text-muted-foreground/80">
          <Calendar className="h-4 w-4 stroke-[1.5] shrink-0" />
          <span className="text-sm">{formatDate(event.date)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 stroke-[1.5] shrink-0 text-muted-foreground/80" />
          <span className="text-data text-sm font-medium">
            {formatTime(event.startTime)}
          </span>
          {event.doorsTime && (
            <span className="text-data text-xs text-muted-foreground/50">
              doors {formatTime(event.doorsTime)}
            </span>
          )}
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2.5 text-muted-foreground/80">
          <MapPin className="h-4 w-4 stroke-[1.5] shrink-0" />
          <span className="text-sm">
            {event.venue.name}, {event.venue.city}
          </span>
        </div>
      </div>

      {/* Origin pill */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
        <span className="text-muted-foreground/70 lowercase">from</span>
        <span className="font-medium lowercase">
          {origin.city.toLowerCase()}, {origin.state.toLowerCase()}
        </span>
        <span className="text-data text-xs font-medium text-muted-foreground/60">
          ({origin.airportCode})
        </span>
      </div>
    </section>
  )
}
