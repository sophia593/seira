"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Ticket,
  Plane,
  Hotel,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  Music,
  Trophy,
  Theater,
  Flag,
  Shuffle
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// =============================================================================
// Types
// =============================================================================

interface EventExample {
  query: string
  event: string
  venue: string
  date: string
  ticketRange: [number, number]
  flightRange: [number, number]
  hotelRange: [number, number]
  ticketDetail: string
  flightDetail: string
  hotelDetail: string
  nights: number
}

type Category = "concerts" | "sports" | "theater" | "racing"

interface CategoryConfig {
  id: Category
  label: string
  icon: React.ReactNode
}

// =============================================================================
// Categories
// =============================================================================

const CATEGORIES: CategoryConfig[] = [
  { id: "concerts", label: "concerts", icon: <Music className="w-3.5 h-3.5" /> },
  { id: "sports", label: "sports", icon: <Trophy className="w-3.5 h-3.5" /> },
  { id: "theater", label: "theater", icon: <Theater className="w-3.5 h-3.5" /> },
  { id: "racing", label: "racing", icon: <Flag className="w-3.5 h-3.5" /> },
]

// =============================================================================
// Example Tags (clickable quick prompts)
// =============================================================================

const EXAMPLE_TAGS = [
  { label: "billie eilish", prompt: "billie eilish concert in LA" },
  { label: "lakers game", prompt: "lakers games in los angeles" },
  { label: "coachella", prompt: "coachella 2026 weekend 1" },
  { label: "f1 austin", prompt: "formula 1 austin grand prix" },
  { label: "hamilton", prompt: "hamilton on broadway" },
  { label: "ufc", prompt: "ufc fights in las vegas" },
]

// =============================================================================
// Detail Pools (option-type descriptors)
// =============================================================================

const TICKET_DETAILS = [
  "lower bowl • center view",
  "upper level • full stage view",
  "floor section • standing room",
  "mezzanine • good sightlines",
  "club level • premium seating",
  "general admission • flexible",
  "sideline • near action",
  "end zone • budget-friendly",
]

const FLIGHT_DETAILS = [
  "nonstop • morning departure",
  "nonstop • afternoon flight",
  "nonstop • evening options",
  "1 stop • flexible times",
  "direct • multiple carriers",
  "red-eye • save a night",
]

const HOTEL_DETAILS = [
  "4★ • walkable neighborhood",
  "3★ • near transit",
  "4★ • downtown area",
  "boutique • trendy district",
  "chain hotel • reliable",
  "4★ • city center",
  "3★ • close to venue",
]

const TICKET_DETAILS_BY_CATEGORY: Record<Category, string[]> = {
  concerts: [
    "lower bowl • center view",
    "floor section • standing room",
    "mezzanine • good sightlines",
    "upper level • full stage view",
    "club level • premium area",
    "general admission • flexible spot",
  ],
  sports: [
    "lower bowl • near court",
    "upper deck • full field view",
    "club level • amenities included",
    "sideline • close to action",
    "end zone • budget option",
    "bleachers • classic experience",
  ],
  theater: [
    "orchestra • center section",
    "mezzanine • great acoustics",
    "balcony • elevated view",
    "front row • immersive",
    "rear orchestra • value pick",
  ],
  racing: [
    "grandstand • turn view",
    "main straight • start/finish",
    "general admission • roaming",
    "paddock access • behind scenes",
    "elevated • panoramic view",
  ],
}

// =============================================================================
// Utility Functions
// =============================================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// =============================================================================
// Concert Generator Pool
// =============================================================================

const CONCERTS_POOL = {
  descriptors: [
    "major tour",
    "stadium show",
    "arena tour",
    "live performance",
    "concert",
    "world tour stop",
  ],

  genres: [
    "pop show",
    "rock concert",
    "hip-hop show",
    "r&b concert",
    "country show",
    "indie concert",
    "latin music show",
    "electronic set",
  ],

  venues: [
    { name: "SoFi Stadium", city: "los angeles" },
    { name: "Madison Square Garden", city: "new york" },
    { name: "United Center", city: "chicago" },
    { name: "Chase Center", city: "san francisco" },
    { name: "TD Garden", city: "boston" },
    { name: "State Farm Arena", city: "atlanta" },
    { name: "Allegiant Stadium", city: "las vegas" },
    { name: "Hard Rock Stadium", city: "miami" },
    { name: "AT&T Stadium", city: "dallas" },
    { name: "Lumen Field", city: "seattle" },
    { name: "Nissan Stadium", city: "nashville" },
    { name: "Empower Field", city: "denver" },
    { name: "Barclays Center", city: "brooklyn" },
  ],

  months: [
    "this spring",
    "this summer",
    "this fall",
    "next month",
    "in march",
    "in april",
    "in may",
    "in june",
    "in july",
    "in august",
    "in september",
    "in october",
  ],

  dateFormats: [
    "Mar 15, 2026",
    "Apr 22, 2026",
    "May 8, 2026",
    "Jun 12, 2026",
    "Jul 18, 2026",
    "Aug 5, 2026",
    "Sep 20, 2026",
    "Oct 10, 2026",
    "Nov 3, 2026",
  ],

  ticketRanges: [
    [120, 180] as [number, number],
    [150, 250] as [number, number],
    [200, 350] as [number, number],
    [250, 450] as [number, number],
    [300, 550] as [number, number],
    [400, 700] as [number, number],
  ],

  flightRanges: [
    [0, 0] as [number, number],
    [120, 200] as [number, number],
    [150, 280] as [number, number],
    [200, 350] as [number, number],
    [250, 420] as [number, number],
  ],

  hotelRanges: [
    [120, 180] as [number, number],
    [150, 250] as [number, number],
    [180, 320] as [number, number],
    [220, 380] as [number, number],
  ],
}

// =============================================================================
// Concert Example Generator
// =============================================================================

function generateConcertExample(): EventExample {
  const venue = pickRandom(CONCERTS_POOL.venues)
  const city = venue.city
  const month = pickRandom(CONCERTS_POOL.months)
  const genre = pickRandom(CONCERTS_POOL.genres)
  const descriptor = pickRandom(CONCERTS_POOL.descriptors)

  const queryTemplates = [
    `${genre} in ${city} ${month}`,
    `${descriptor} in ${city}`,
    `concerts in ${city} ${month}`,
    `live music in ${city} ${month}`,
    `${genre} near ${city}`,
  ]
  const query = pickRandom(queryTemplates)

  const eventNames = [
    `${genre.charAt(0).toUpperCase() + genre.slice(1)}`,
    `Live in ${city.charAt(0).toUpperCase() + city.slice(1)}`,
    `${descriptor.charAt(0).toUpperCase() + descriptor.slice(1)}`,
    "Tour Stop",
    "Live Performance",
  ]
  const event = pickRandom(eventNames)

  const ticketRange = pickRandom(CONCERTS_POOL.ticketRanges)
  const flightRange = pickRandom(CONCERTS_POOL.flightRanges)
  const hotelRange = pickRandom(CONCERTS_POOL.hotelRanges)

  const flightDetail = flightRange[0] === 0 && flightRange[1] === 0
    ? "local • no flight needed"
    : pickRandom(FLIGHT_DETAILS)

  return {
    query,
    event,
    venue: `${venue.name}, ${city.charAt(0).toUpperCase() + city.slice(1)}`,
    date: pickRandom(CONCERTS_POOL.dateFormats),
    ticketRange,
    flightRange,
    hotelRange,
    ticketDetail: pickRandom(TICKET_DETAILS_BY_CATEGORY.concerts),
    flightDetail,
    hotelDetail: pickRandom(HOTEL_DETAILS),
    nights: Math.random() > 0.3 ? 2 : 1,
  }
}

// =============================================================================
// Base Examples (Sports, Theater, Racing)
// =============================================================================

const SPORTS_BASE: Omit<EventExample, 'ticketDetail' | 'flightDetail' | 'hotelDetail'>[] = [
  { query: "lakers vs celtics in boston", event: "NBA Regular Season", venue: "TD Garden, Boston", date: "Feb 14, 2026", ticketRange: [250, 400], flightRange: [180, 300], hotelRange: [180, 280], nights: 2 },
  { query: "super bowl in new orleans", event: "NFL Championship", venue: "Caesars Superdome, New Orleans", date: "Feb 8, 2026", ticketRange: [3500, 5500], flightRange: [200, 350], hotelRange: [300, 500], nights: 3 },
  { query: "yankees vs red sox at fenway", event: "MLB Rivalry Game", venue: "Fenway Park, Boston", date: "Jul 4, 2026", ticketRange: [120, 220], flightRange: [100, 180], hotelRange: [180, 300], nights: 2 },
  { query: "ufc in vegas", event: "UFC Main Event", venue: "T-Mobile Arena, Las Vegas", date: "Apr 13, 2026", ticketRange: [350, 550], flightRange: [120, 220], hotelRange: [150, 280], nights: 2 },
  { query: "warriors game in san francisco", event: "NBA Regular Season", venue: "Chase Center, San Francisco", date: "Mar 20, 2026", ticketRange: [180, 320], flightRange: [150, 280], hotelRange: [200, 350], nights: 2 },
]

const THEATER_BASE: Omit<EventExample, 'ticketDetail' | 'flightDetail' | 'hotelDetail'>[] = [
  { query: "hamilton on broadway nyc", event: "Hamilton", venue: "Richard Rodgers Theatre, NYC", date: "Mar 15, 2026", ticketRange: [280, 450], flightRange: [150, 280], hotelRange: [220, 380], nights: 2 },
  { query: "wicked in london west end", event: "Wicked", venue: "Apollo Victoria Theatre, London", date: "Apr 22, 2026", ticketRange: [140, 240], flightRange: [450, 700], hotelRange: [220, 380], nights: 3 },
  { query: "lion king broadway tickets", event: "The Lion King", venue: "Minskoff Theatre, NYC", date: "Jul 18, 2026", ticketRange: [150, 280], flightRange: [120, 240], hotelRange: [200, 350], nights: 2 },
  { query: "phantom of the opera london", event: "Phantom of the Opera", venue: "His Majesty's Theatre, London", date: "May 10, 2026", ticketRange: [120, 220], flightRange: [420, 680], hotelRange: [200, 340], nights: 3 },
]

const RACING_BASE: Omit<EventExample, 'ticketDetail' | 'flightDetail' | 'hotelDetail'>[] = [
  { query: "f1 monaco grand prix", event: "Formula 1 Monaco GP", venue: "Circuit de Monaco", date: "May 25, 2026", ticketRange: [700, 1200], flightRange: [550, 850], hotelRange: [350, 600], nights: 3 },
  { query: "f1 austin texas gp", event: "Formula 1 US Grand Prix", venue: "Circuit of the Americas, Austin", date: "Oct 19, 2026", ticketRange: [380, 620], flightRange: [150, 280], hotelRange: [180, 320], nights: 2 },
  { query: "daytona 500 nascar race", event: "Daytona 500", venue: "Daytona International Speedway, FL", date: "Feb 15, 2026", ticketRange: [200, 380], flightRange: [120, 240], hotelRange: [140, 250], nights: 2 },
  { query: "f1 miami grand prix", event: "Formula 1 Miami GP", venue: "Miami International Autodrome", date: "May 4, 2026", ticketRange: [450, 750], flightRange: [140, 260], hotelRange: [220, 380], nights: 2 },
]

// =============================================================================
// Example Generator with Fresh Details
// =============================================================================

function generateExampleWithDetails(
  base: Omit<EventExample, 'ticketDetail' | 'flightDetail' | 'hotelDetail'>,
  category: Category
): EventExample {
  const isLocal = base.flightRange[0] === 0 && base.flightRange[1] === 0
  return {
    ...base,
    ticketDetail: pickRandom(TICKET_DETAILS_BY_CATEGORY[category]),
    flightDetail: isLocal ? "local • no flight needed" : pickRandom(FLIGHT_DETAILS),
    hotelDetail: pickRandom(HOTEL_DETAILS),
  }
}

function getRandomExample(category: Category): EventExample {
  if (category === "concerts") {
    return generateConcertExample()
  }

  const baseArrays: Record<Exclude<Category, 'concerts'>, Omit<EventExample, 'ticketDetail' | 'flightDetail' | 'hotelDetail'>[]> = {
    sports: SPORTS_BASE,
    theater: THEATER_BASE,
    racing: RACING_BASE,
  }

  const base = pickRandom(baseArrays[category])
  return generateExampleWithDetails(base, category)
}

// =============================================================================
// Constants
// =============================================================================

const CYCLE_INTERVAL = 8000
const ANIMATION_STEP_DELAY = 350

// =============================================================================
// Utility: Format price range
// =============================================================================

function formatRange(range: [number, number], prefix = "~$"): string {
  if (range[0] === 0 && range[1] === 0) {
    return "free"
  }
  if (range[0] === range[1]) {
    return `${prefix}${range[0].toLocaleString()}`
  }
  return `${prefix}${range[0].toLocaleString()}–${range[1].toLocaleString()}`
}

// =============================================================================
// Utility: Compute total range
// =============================================================================

function computeTotalRange(
  ticketRange: [number, number],
  flightRange: [number, number],
  hotelRange: [number, number],
  nights: number
): [number, number] {
  const low = ticketRange[0] + flightRange[0] + hotelRange[0] * nights
  const high = ticketRange[1] + flightRange[1] + hotelRange[1] * nights
  return [low, high]
}

// =============================================================================
// Animated Price Card
// =============================================================================

type AnimationPhase = "searching" | "found" | "idle"

interface AnimatedPriceCardProps {
  icon: React.ReactNode
  label: string
  range: [number, number]
  suffix?: string
  phase: AnimationPhase
  detail: string
}

function AnimatedPriceCard({ icon, label, range, suffix, phase, detail }: AnimatedPriceCardProps) {
  const showTooltip = phase === "found" && !(range[0] === 0 && range[1] === 0)
  const isLocal = range[0] === 0 && range[1] === 0

  const cardContent = (
    <div className={cn(
      "flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl bg-muted/50 min-h-[88px] sm:min-h-[96px] transition-colors",
      showTooltip && "hover:bg-muted cursor-help"
    )}>
      <div className="text-muted-foreground">{icon}</div>

      <AnimatePresence mode="wait">
        {phase === "searching" ? (
          <motion.div
            key="searching"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.7 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-1"
          >
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">matching...</span>
          </motion.div>
        ) : phase === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0.5 }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="text-lg sm:text-xl font-semibold text-muted-foreground/30">—</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground/50">{label}</div>
          </motion.div>
        ) : (
          <motion.div
            key="found"
            initial={{ opacity: 0.8, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="text-base sm:text-lg font-semibold">
              {isLocal ? "local" : formatRange(range)}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {label}{suffix}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (!showTooltip) return cardContent

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        {cardContent}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-[200px] text-center text-xs"
      >
        {detail}
      </TooltipContent>
    </Tooltip>
  )
}

// =============================================================================
// Demo Preview Component
// =============================================================================

export function DemoPreview() {
  const [activeCategory, setActiveCategory] = useState<Category>("concerts")
  const [current, setCurrent] = useState<EventExample>(() => generateConcertExample())
  const [animationStep, setAnimationStep] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)

  const totalRange = useMemo(() => {
    return computeTotalRange(
      current.ticketRange,
      current.flightRange,
      current.hotelRange,
      current.nights
    )
  }, [current])

  const runAnimation = useCallback(() => {
    setAnimationStep(0)

    const t1 = setTimeout(() => setAnimationStep(1), 80)
    const t2 = setTimeout(() => setAnimationStep(2), ANIMATION_STEP_DELAY + 80)
    const t3 = setTimeout(() => setAnimationStep(3), ANIMATION_STEP_DELAY * 2 + 80)
    const t4 = setTimeout(() => setAnimationStep(4), ANIMATION_STEP_DELAY * 3 + 80)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  useEffect(() => {
    const cleanup = runAnimation()
    return cleanup
  }, [current, runAnimation])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(getRandomExample(activeCategory))
    }, CYCLE_INTERVAL)

    return () => clearInterval(interval)
  }, [activeCategory])

  function handleCategoryChange(category: Category) {
    if (category === activeCategory) return
    setActiveCategory(category)
    setCurrent(getRandomExample(category))
  }

  function handleShuffle() {
    setIsShuffling(true)
    setCurrent(getRandomExample(activeCategory))
    setTimeout(() => setIsShuffling(false), 300)
  }

  const ticketPhase: AnimationPhase = animationStep === 0 ? "idle" : animationStep === 1 ? "searching" : "found"
  const flightPhase: AnimationPhase = animationStep < 2 ? "idle" : animationStep === 2 ? "searching" : "found"
  const hotelPhase: AnimationPhase = animationStep < 3 ? "idle" : animationStep === 3 ? "searching" : "found"
  const showTotal = animationStep >= 4

  return (
    <TooltipProvider>
      <div className="w-full max-w-xl mx-auto">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors min-h-[36px]",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Disclaimer Line */}
        <p className="text-xs text-muted-foreground/60 text-center mb-4">
          Example preview — real quotes appear after you search.
        </p>

        {/* Main Card */}
        <motion.div
          key={current.query}
          initial={{ opacity: 0.9, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-5 sm:p-6 shadow-lg"
        >
          {/* Search Query */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm text-primary">&#10022;</span>
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
              <span>{current.date} • {current.nights} night{current.nights > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Animated Price Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
            <AnimatedPriceCard
              icon={<Ticket className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="ticket"
              range={current.ticketRange}
              phase={ticketPhase}
              detail={current.ticketDetail}
            />
            <AnimatedPriceCard
              icon={<Plane className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="flight"
              range={current.flightRange}
              suffix=" rt"
              phase={flightPhase}
              detail={current.flightDetail}
            />
            <AnimatedPriceCard
              icon={<Hotel className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="hotel"
              range={current.hotelRange}
              suffix="/n"
              phase={hotelPhase}
              detail={current.hotelDetail}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">typical total range</div>
              <AnimatePresence mode="wait">
                {showTotal ? (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0.8, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl sm:text-2xl font-semibold"
                  >
                    {formatRange(totalRange)}
                  </motion.div>
                ) : (
                  <motion.div
                    key="calculating"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.7 }}
                    transition={{ duration: 0.15 }}
                    className="text-xl sm:text-2xl font-semibold text-muted-foreground/50"
                  >
                    matching...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link
              href="/search"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors",
                showTotal
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground pointer-events-none"
              )}
            >
              try this search
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Shuffle Button */}
        <div className="flex justify-center mt-5">
          <button
            onClick={handleShuffle}
            disabled={isShuffling}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm text-muted-foreground",
              "hover:bg-muted transition-colors",
              isShuffling && "opacity-50"
            )}
          >
            <Shuffle className={cn("w-4 h-4", isShuffling && "animate-spin")} />
            <span>show me another</span>
          </button>
        </div>

        {/* Example Tags */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/60 mb-3">or try one of these</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {EXAMPLE_TAGS.map((tag) => (
              <Link
                key={tag.label}
                href="/search"
                className="px-4 py-2.5 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[40px] flex items-center"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// =============================================================================
// Minimal Version
// =============================================================================

export function DemoPreviewMinimal() {
  const [current, setCurrent] = useState<EventExample>(() => generateConcertExample())

  useEffect(() => {
    const categories: Category[] = ["concerts", "sports", "theater", "racing"]
    let categoryIndex = 0

    const interval = setInterval(() => {
      categoryIndex = (categoryIndex + 1) % categories.length
      setCurrent(getRandomExample(categories[categoryIndex]))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        key={current.query}
        initial={{ opacity: 0.9, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="rounded-xl border bg-card p-5 shadow-sm"
      >
        <div className="text-sm text-muted-foreground mb-3">
          &ldquo;{current.query}&rdquo;
        </div>

        <div className="font-medium mb-4">{current.event}</div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-muted-foreground" />
            <span>{formatRange(current.ticketRange)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane className="w-4 h-4 text-muted-foreground" />
            <span>{formatRange(current.flightRange)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hotel className="w-4 h-4 text-muted-foreground" />
            <span>{formatRange(current.hotelRange)}/n</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// =============================================================================
// Static Version
// =============================================================================

export function DemoPreviewStatic() {
  const examples = [
    generateConcertExample(),
    getRandomExample("sports"),
    getRandomExample("theater"),
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="grid md:grid-cols-3 gap-4">
        {examples.map((example, index) => (
          <Link
            key={index}
            href="/search"
            className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-xs text-muted-foreground mb-2">
              &ldquo;{example.query}&rdquo;
            </div>
            <div className="font-medium text-sm mb-3">{example.event}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                {formatRange(example.ticketRange)}
              </span>
              <span className="flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" />
                {formatRange(example.flightRange)}
              </span>
              <span className="flex items-center gap-1">
                <Hotel className="w-3.5 h-3.5" />
                {formatRange(example.hotelRange)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
