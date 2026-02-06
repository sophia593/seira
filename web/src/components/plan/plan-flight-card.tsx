"use client"

import { Check, Plane } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeasibilityBadge } from "@/components/ui/feasibility-badge"
import type { FlightOption, ConstraintFlag } from "@/lib/types"

interface PlanFlightCardProps {
  flight: FlightOption
  selected?: boolean
  recommended?: boolean
  onSelect?: (id: string) => void
  constraintFlags?: ConstraintFlag[]
  className?: string
}

function formatFlightTime(iso: string) {
  const d = new Date(iso)
  return d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()
}

export function PlanFlightCard({
  flight,
  selected = false,
  recommended = false,
  onSelect,
  constraintFlags = [],
  className,
}: PlanFlightCardProps) {
  const depTime = formatFlightTime(flight.departure.time)
  const arrTime = formatFlightTime(flight.arrival.time)
  const stopsText =
    flight.stops === 0
      ? "nonstop"
      : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}${flight.stopCities ? ` (${flight.stopCities[0].toLowerCase()})` : ""}`

  const relatedFlags = constraintFlags.filter(
    (f) => f.targetType === "flight" && f.targetId === flight.id,
  )

  return (
    <button
      type="button"
      onClick={() => onSelect?.(flight.id)}
      data-flight-id={flight.id}
      className={cn(
        "w-full text-left rounded-2xl p-5 sm:p-6 transition-all duration-200 group",
        "border",
        selected
          ? "border-primary/50 bg-primary/[0.03] dark:bg-primary/[0.06] ring-1 ring-primary/20"
          : "border-transparent bg-card/40 hover:bg-card/70 hover:border-border/30",
        className,
      )}
    >
      {/* Top: recommended + airline info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {recommended && (
            <span className="text-[10px] font-medium uppercase tracking-widest text-primary/80 bg-primary/[0.08] px-2.5 py-1 rounded-full">
              recommended
            </span>
          )}
          <span className="text-xs text-muted-foreground/50 lowercase tracking-tight">
            {flight.airline}
          </span>
          <span className="text-data text-xs text-muted-foreground/40">
            {flight.flightNumber}
          </span>
        </div>
        {selected && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        )}
      </div>

      {/* Main row: times + price */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Route times */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-data text-lg sm:text-xl font-semibold">
              {depTime}
            </span>
            <span className="text-data text-xs text-muted-foreground/50 uppercase">
              {flight.departure.airport}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground/30">
            <div className="w-6 sm:w-10 h-px bg-current" />
            <Plane className="h-3 w-3 shrink-0 -rotate-0" />
            <div className="w-6 sm:w-10 h-px bg-current" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-data text-lg sm:text-xl font-semibold">
              {arrTime}
            </span>
            <span className="text-data text-xs text-muted-foreground/50 uppercase">
              {flight.arrival.airport}
            </span>
          </div>
        </div>

        {/* Price */}
        <span className="text-data text-xl sm:text-2xl font-bold shrink-0">
          ${flight.price}
        </span>
      </div>

      {/* Duration + stops row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground/50 mb-4">
        <span className="text-data">{flight.duration}</span>
        <span className="text-muted-foreground/20">&middot;</span>
        <span className="lowercase">{stopsText}</span>
      </div>

      {/* Feasibility badge */}
      <FeasibilityBadge
        label={flight.timingTag.label}
        severity={flight.timingTag.severity}
        buffer={
          flight.timingTag.minutesBuffer > 0
            ? `${Math.floor(flight.timingTag.minutesBuffer / 60)}h ${flight.timingTag.minutesBuffer % 60}m`
            : undefined
        }
      />

      {/* Constraint flags for this specific flight */}
      {relatedFlags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/20 space-y-2">
          {relatedFlags.map((flag) => (
            <p
              key={flag.id}
              className={cn(
                "text-xs leading-relaxed",
                flag.severity === "danger"
                  ? "text-rose-600 dark:text-rose-400"
                  : flag.severity === "warning"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground/60",
              )}
            >
              {flag.message}
            </p>
          ))}
        </div>
      )}
    </button>
  )
}
