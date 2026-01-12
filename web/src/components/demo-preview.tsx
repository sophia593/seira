"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Ticket, Plane, Hotel, MapPin, Calendar, ArrowRight } from "lucide-react"

// =============================================================================
// Event Data
// =============================================================================

interface EventExample {
  query: string
  event: string
  venue: string
  date: string
  ticket: number
  flight: number
  hotel: number
  tag: string
}

const EXAMPLES: EventExample[] = [
  {
    query: "taylor swift in LA",
    event: "The Eras Tour",
    venue: "SoFi Stadium, Los Angeles",
    date: "Aug 7, 2026",
    ticket: 450,
    flight: 289,
    hotel: 180,
    tag: "taylor",
  },
  {
    query: "lakers vs celtics in boston",
    event: "NBA Regular Season",
    venue: "TD Garden, Boston",
    date: "Feb 14, 2026",
    ticket: 320,
    flight: 245,
    hotel: 210,
    tag: "lakers",
  },
  {
    query: "coachella weekend 1",
    event: "Coachella 2026",
    venue: "Empire Polo Club, Indio",
    date: "Apr 11-13, 2026",
    ticket: 599,
    flight: 189,
    hotel: 290,
    tag: "coachella",
  },
  {
    query: "f1 monaco grand prix",
    event: "Formula 1 Monaco GP",
    venue: "Circuit de Monaco",
    date: "May 25, 2026",
    ticket: 890,
    flight: 680,
    hotel: 450,
    tag: "f1",
  },
  {
    query: "ufc 300 in vegas",
    event: "UFC 300",
    venue: "T-Mobile Arena, Las Vegas",
    date: "Mar 2, 2026",
    ticket: 275,
    flight: 150,
    hotel: 120,
    tag: "ufc",
  },
  {
    query: "hamilton on broadway",
    event: "Hamilton",
    venue: "Richard Rodgers Theatre, NYC",
    date: "Mar 15, 2026",
    ticket: 350,
    flight: 199,
    hotel: 280,
    tag: "hamilton",
  },
]

const CYCLE_INTERVAL = 4000

// =============================================================================
// Price Card Component
// =============================================================================

interface PriceCardProps {
  icon: React.ReactNode
  label: string
  price: number
  suffix?: string
}

function PriceCard({ icon, label, price, suffix }: PriceCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 sm:p-4 rounded-xl bg-muted/50">
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-lg sm:text-xl font-semibold">${price.toLocaleString()}</div>
      <div className="text-[10px] sm:text-xs text-muted-foreground">
        {label}{suffix && <span className="opacity-70">{suffix}</span>}
      </div>
    </div>
  )
}

// =============================================================================
// Demo Preview Component
// =============================================================================

export function DemoPreview() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const current = EXAMPLES[currentIndex]
  const total = current.ticket + current.flight + current.hotel * 2

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % EXAMPLES.length)
        setIsAnimating(false)
      }, 300)
    }, CYCLE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  function handleSelect(index: number) {
    if (index === currentIndex) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsAnimating(false)
    }, 200)
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Main Card */}
      <div
        className={cn(
          "rounded-2xl border bg-card p-5 sm:p-6 shadow-lg transition-all duration-300",
          isAnimating && "opacity-0 scale-[0.98]"
        )}
      >
        {/* Search Query */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm text-primary">✦</span>
          </div>
          <div className="flex-1 px-4 py-2 rounded-full bg-muted text-sm truncate">
            &ldquo;{current.query}&rdquo;
          </div>
        </div>

        {/* Event Info */}
        <div className="mb-5 sm:mb-6 space-y-1.5">
          <h3 className="font-semibold text-base sm:text-lg">{current.event}</h3>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{current.venue}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{current.date}</span>
          </div>
        </div>

        {/* Price Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <PriceCard
            icon={<Ticket className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="ticket"
            price={current.ticket}
          />
          <PriceCard
            icon={<Plane className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="flight"
            price={current.flight}
            suffix=" rt"
          />
          <PriceCard
            icon={<Hotel className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="hotel"
            price={current.hotel}
            suffix="/n"
          />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground">estimated total</div>
            <div className="text-xl sm:text-2xl font-semibold">~${total.toLocaleString()}</div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.97]">
            plan this trip
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {EXAMPLES.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
            )}
            aria-label={`View example ${index + 1}`}
          />
        ))}
      </div>

      {/* Quick Select Tags */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
        {EXAMPLES.map((example, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={cn(
              "px-3 py-1 rounded-full text-xs transition-all duration-200 active:scale-[0.97]",
              index === currentIndex
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {example.tag}
          </button>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Minimal Version
// =============================================================================

export function DemoPreviewMinimal() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const current = EXAMPLES[currentIndex]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % EXAMPLES.length)
        setIsAnimating(false)
      }, 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={cn(
          "rounded-xl border bg-card p-5 shadow-sm transition-all duration-200",
          isAnimating && "opacity-0 scale-[0.98]"
        )}
      >
        <div className="text-sm text-muted-foreground mb-3">
          &ldquo;{current.query}&rdquo;
        </div>

        <div className="font-medium mb-4">{current.event}</div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-muted-foreground" />
            <span>${current.ticket}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane className="w-4 h-4 text-muted-foreground" />
            <span>${current.flight}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hotel className="w-4 h-4 text-muted-foreground" />
            <span>${current.hotel}/n</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {EXAMPLES.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              index === currentIndex ? "bg-foreground" : "bg-foreground/20"
            )}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Static Version (no animation, for SSR)
// =============================================================================

export function DemoPreviewStatic() {
  const examples = EXAMPLES.slice(0, 3)

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="grid md:grid-cols-3 gap-4">
        {examples.map((example, index) => (
          <div
            key={index}
            className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-xs text-muted-foreground mb-2">
              &ldquo;{example.query}&rdquo;
            </div>
            <div className="font-medium text-sm mb-3">{example.event}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                ${example.ticket}
              </span>
              <span className="flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" />
                ${example.flight}
              </span>
              <span className="flex items-center gap-1">
                <Hotel className="w-3.5 h-3.5" />
                ${example.hotel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
