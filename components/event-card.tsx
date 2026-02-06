import Link from "next/link"
import { Calendar, MapPin, Clock } from "lucide-react"
import type { Event } from "@/lib/types"
import { cn } from "@/lib/utils"

const categoryColors: Record<string, string> = {
  sports: "bg-primary/10 text-primary",
  music: "bg-safe/10 text-safe",
  theater: "bg-risky/10 text-risky",
  festival: "bg-impossible/10 text-impossible",
  film: "bg-muted-foreground/10 text-muted-foreground",
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(":")
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? "pm" : "am"
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${m} ${ampm}`
}

export function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      {/* Category badge */}
      <span
        className={cn(
          "self-start rounded-lg px-2.5 py-0.5 text-xs font-medium",
          categoryColors[event.category] ?? "bg-muted text-muted-foreground"
        )}
      >
        {event.category}
      </span>

      {/* Title */}
      <h3 className="text-base font-semibold leading-snug text-card-foreground group-hover:underline underline-offset-2">
        {event.name}
      </h3>

      {/* Data rows — mono font */}
      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0" />
          <span className="data-value">{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="shrink-0" />
          <span className="data-value">{formatTime(event.startTime)}</span>
          {event.doorsTime && (
            <span className="text-xs text-muted-foreground/70">
              (doors <span className="data-value">{formatTime(event.doorsTime)}</span>)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">
            {event.venue.name}, {event.venue.city}
          </span>
        </div>
      </div>
    </Link>
  )
}
