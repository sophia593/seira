"use client"

import { Check, Star, Footprints, Car } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HotelOption, ConstraintFlag } from "@/lib/types"

interface PlanHotelCardProps {
  hotel: HotelOption
  selected?: boolean
  topPick?: boolean
  onSelect?: (id: string) => void
  constraintFlags?: ConstraintFlag[]
  className?: string
}

export function PlanHotelCard({
  hotel,
  selected = false,
  topPick = false,
  onSelect,
  constraintFlags = [],
  className,
}: PlanHotelCardProps) {
  const ModeIcon = hotel.distanceToVenue.mode === "walk" ? Footprints : Car
  const relatedFlags = constraintFlags.filter(
    (f) => f.targetType === "hotel" && f.targetId === hotel.id,
  )

  return (
    <button
      type="button"
      onClick={() => onSelect?.(hotel.id)}
      data-hotel-id={hotel.id}
      className={cn(
        "w-full text-left rounded-2xl p-5 sm:p-6 transition-all duration-200 group",
        "border",
        selected
          ? "border-primary/50 bg-primary/[0.03] dark:bg-primary/[0.06] ring-1 ring-primary/20"
          : "border-transparent bg-card/40 hover:bg-card/70 hover:border-border/30",
        className,
      )}
    >
      {/* Top: top pick + rating */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {topPick && (
            <span className="text-[10px] font-medium uppercase tracking-widest text-primary/80 bg-primary/[0.08] px-2.5 py-1 rounded-full">
              top pick
            </span>
          )}
          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.round(hotel.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/20",
                )}
              />
            ))}
            <span className="text-data text-xs text-muted-foreground/50 ml-1.5">
              {hotel.rating}
            </span>
          </div>
        </div>
        {selected && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        )}
      </div>

      {/* Hotel name */}
      <h3 className="text-base sm:text-lg font-semibold lowercase tracking-tight mb-4 leading-snug">
        {hotel.name}
      </h3>

      {/* Price + distance row - equal visual weight */}
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <div>
          <span className="text-data text-xl font-bold">${hotel.pricePerNight}</span>
          <span className="text-xs text-muted-foreground/50 ml-1">/nt</span>
          {hotel.nights > 1 && (
            <span className="text-data text-xs text-muted-foreground/40 ml-2">
              ${hotel.totalPrice} total
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ModeIcon className="h-3.5 w-3.5 text-muted-foreground/50 stroke-[1.5]" />
          <span className="text-data text-base font-semibold">
            {hotel.distanceToVenue.miles} mi
          </span>
          <span className="text-xs text-muted-foreground/50 lowercase">
            {hotel.distanceToVenue.transitMinutes} min{" "}
            {hotel.distanceToVenue.mode}
          </span>
        </div>
      </div>

      {/* Check-in / check-out */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground/40 mb-1">
        <span>
          in{" "}
          <span className="text-data text-muted-foreground/60">
            {hotel.checkIn}
          </span>
        </span>
        <span>
          out{" "}
          <span className="text-data text-muted-foreground/60">
            {hotel.checkOut}
          </span>
        </span>
      </div>

      {/* Related constraint flags */}
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
