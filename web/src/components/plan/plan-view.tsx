"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { toast } from "sonner"
import type { Plan, HotelOption } from "@/lib/types"

import { EventAnchor } from "./event-anchor"
import { DangerBanner } from "./danger-banner"
import { SectionHeading } from "./section-heading"
import { PlanFlightCard } from "./plan-flight-card"
import { PlanHotelCard } from "./plan-hotel-card"
import { TransportRow } from "./transport-row"
import { CostSummary } from "./cost-summary"
import { MobileCostBar } from "./mobile-cost-bar"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlanViewProps {
  plan: Plan
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanView({ plan }: PlanViewProps) {
  // --- selections ---
  const [selectedOutbound, setSelectedOutbound] = useState<string | null>(
    plan.selections.flightOutbound ?? null,
  )
  const [selectedReturn, setSelectedReturn] = useState<string | null>(
    plan.selections.flightReturn ?? null,
  )
  const [selectedHotel, setSelectedHotel] = useState<string | null>(
    plan.selections.hotel ?? null,
  )

  // --- refs for scroll-to-target ---
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToTarget = useCallback((targetId: string) => {
    const el = containerRef.current?.querySelector(
      `[data-flight-id="${targetId}"], [data-hotel-id="${targetId}"]`,
    )
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      // Brief flash effect
      el.classList.add("ring-2", "ring-rose-400/40")
      setTimeout(() => el.classList.remove("ring-2", "ring-rose-400/40"), 2000)
    }
  }, [])

  // --- computed selected total ---
  const selectedTotal = useMemo(() => {
    const outFlight = plan.flights.outbound.find(
      (f) => f.id === selectedOutbound,
    )
    const retFlight = plan.flights.return.find((f) => f.id === selectedReturn)
    const hotel = plan.hotels.find((h) => h.id === selectedHotel)

    const parts: number[] = []
    if (outFlight) parts.push(outFlight.price)
    if (retFlight) parts.push(retFlight.price)
    if (hotel) parts.push(hotel.totalPrice)

    // Add average ground transport
    const avgGround = plan.groundTransport.reduce(
      (sum, s) => sum + s.rideshareEstimate,
      0,
    )
    if (parts.length > 0) parts.push(avgGround)

    return parts.length > 0 ? parts.reduce((a, b) => a + b, 0) : null
  }, [selectedOutbound, selectedReturn, selectedHotel, plan])

  // --- hotel clusters ---
  const nearVenueHotels = plan.hotels.filter((h) => h.cluster === "near-venue")
  const valueHotels = plan.hotels.filter((h) => h.cluster === "value")

  // Pick "top pick" for each cluster (lowest distance for near-venue, lowest price for value)
  const nearVenueTopPick = nearVenueHotels.reduce<HotelOption | null>(
    (best, h) =>
      !best || h.distanceToVenue.miles < best.distanceToVenue.miles ? h : best,
    null,
  )
  const valueTopPick = valueHotels.reduce<HotelOption | null>(
    (best, h) => (!best || h.pricePerNight < best.pricePerNight ? h : best),
    null,
  )

  // Best-balance outbound = first one (sorted by our data already)
  const recommendedOutbound = plan.flights.outbound[0]?.id
  const recommendedReturn = plan.flights.return[0]?.id

  // --- handlers ---
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `Seira trip plan: ${plan.event.name}`,
        text: `Check out this trip plan for ${plan.event.name}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard")
    }
  }

  function handleSave() {
    toast.success("Plan saved")
  }

  return (
    <div ref={containerRef} className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-40 md:pb-12">
      {/* [1] EVENT ANCHOR */}
      <EventAnchor
        event={plan.event}
        origin={plan.origin}
        className="mb-10"
      />

      {/* [8] DANGER BANNER (conditional) */}
      <DangerBanner
        flags={plan.constraintFlags}
        onScrollToTarget={scrollToTarget}
        className="mb-12"
      />

      {/* [3] GETTING THERE (outbound flights) */}
      <section className="mb-16">
        <SectionHeading
          title="getting there"
          meta={plan.travelDates.arrive}
        />
        <div className="space-y-3">
          {plan.flights.outbound.map((flight) => (
            <PlanFlightCard
              key={flight.id}
              flight={flight}
              selected={selectedOutbound === flight.id}
              recommended={flight.id === recommendedOutbound}
              onSelect={(id) =>
                setSelectedOutbound((prev) => (prev === id ? null : id))
              }
              constraintFlags={plan.constraintFlags}
            />
          ))}
        </div>
      </section>

      {/* [4] GETTING HOME (return flights) */}
      <section className="mb-16">
        <SectionHeading
          title="getting home"
          meta={plan.travelDates.depart}
        />
        <div className="space-y-3">
          {plan.flights.return.map((flight) => (
            <PlanFlightCard
              key={flight.id}
              flight={flight}
              selected={selectedReturn === flight.id}
              recommended={flight.id === recommendedReturn}
              onSelect={(id) =>
                setSelectedReturn((prev) => (prev === id ? null : id))
              }
              constraintFlags={plan.constraintFlags}
            />
          ))}
        </div>
      </section>

      {/* [5] WHERE TO STAY (hotels) */}
      <section className="mb-16">
        <SectionHeading
          title="where to stay"
          meta={`${plan.travelDates.arrive} – ${plan.travelDates.depart} · ${plan.hotels[0]?.nights ?? 1} night`}
        />

        {/* Near venue cluster */}
        {nearVenueHotels.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-4">
              near the venue
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {nearVenueHotels.map((hotel) => (
                <PlanHotelCard
                  key={hotel.id}
                  hotel={hotel}
                  selected={selectedHotel === hotel.id}
                  topPick={hotel.id === nearVenueTopPick?.id}
                  onSelect={(id) =>
                    setSelectedHotel((prev) => (prev === id ? null : id))
                  }
                  constraintFlags={plan.constraintFlags}
                />
              ))}
            </div>
          </div>
        )}

        {/* Value cluster */}
        {valueHotels.length > 0 && (
          <div>
            <h3 className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-4">
              best value
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {valueHotels.map((hotel) => (
                <PlanHotelCard
                  key={hotel.id}
                  hotel={hotel}
                  selected={selectedHotel === hotel.id}
                  topPick={hotel.id === valueTopPick?.id}
                  onSelect={(id) =>
                    setSelectedHotel((prev) => (prev === id ? null : id))
                  }
                  constraintFlags={plan.constraintFlags}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* [6] GETTING AROUND (ground transport) */}
      <section className="mb-16">
        <SectionHeading title="getting around" />
        <div className="divide-y divide-border/20">
          {plan.groundTransport.map((segment, i) => (
            <TransportRow key={i} segment={segment} />
          ))}
        </div>
      </section>

      {/* [7] TRIP COST — hidden on mobile (replaced by sticky bar) */}
      <section className="hidden md:block">
        <CostSummary
          costEstimate={plan.costEstimate}
          selectedTotal={selectedTotal}
          onShare={handleShare}
          onSave={handleSave}
        />
      </section>

      {/* MOBILE STICKY COST BAR */}
      <MobileCostBar
        costEstimate={plan.costEstimate}
        selectedTotal={selectedTotal}
        onShare={handleShare}
        onSave={handleSave}
      />
    </div>
  )
}
