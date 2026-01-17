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
  RefreshCw
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
  { label: "taylor swift", prompt: "taylor swift eras tour" },
  { label: "lakers game", prompt: "lakers games in los angeles" },
  { label: "coachella", prompt: "coachella 2026 weekend 1" },
  { label: "f1 miami", prompt: "formula 1 miami grand prix" },
  { label: "hamilton", prompt: "hamilton on broadway" },
  { label: "ufc", prompt: "ufc fights in las vegas" },
]

// =============================================================================
// Concerts Generator Pool
// =============================================================================

const CONCERTS_POOL = {
  // Generic descriptors to avoid making specific tour claims
  descriptors: [
    "major tour",
    "stadium show",
    "arena tour",
    "live performance",
    "concert",
    "world tour stop",
  ],

  artists: [
    "popular artist",
    "top artist",
    "touring artist",
    "headliner",
    "chart-topping artist",
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
    { name: "Crypto.com Arena", city: "los angeles" },
    { name: "TD Garden", city: "boston" },
    { name: "State Farm Arena", city: "atlanta" },
    { name: "Allegiant Stadium", city: "las vegas" },
    { name: "Hard Rock Stadium", city: "miami" },
    { name: "AT&T Stadium", city: "dallas" },
    { name: "Lumen Field", city: "seattle" },
    { name: "Nissan Stadium", city: "nashville" },
    { name: "Empower Field", city: "denver" },
    { name: "The Forum", city: "los angeles" },
    { name: "Barclays Center", city: "brooklyn" },
  ],

  cities: [
    "los angeles",
    "new york",
    "chicago",
    "san francisco",
    "boston",
    "atlanta",
    "las vegas",
    "miami",
    "dallas",
    "seattle",
    "nashville",
    "denver",
    "phoenix",
    "austin",
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
    [0, 0] as [number, number], // local
    [120, 200] as [number, number],
    [150, 280] as [number, number],
    [200, 350] as [number, number],
    [250, 420] as [number, number],
    [300, 500] as [number, number],
  ],

  hotelRanges: [
    [120, 180] as [number, number],
    [150, 250] as [number, number],
    [180, 320] as [number, number],
    [220, 380] as [number, number],
    [280, 450] as [number, number],
  ],

  ticketDetails: [
    "lower bowl • good sightlines",
    "upper level • full stage view",
    "floor section • standing area",
    "mezzanine • center-ish view",
    "club level • premium area",
    "general admission • flexible spot",
  ],

  flightDetails: [
    "nonstop • morning options",
    "nonstop • afternoon departures",
    "1 stop • flexible times",
    "direct • evening flights",
    "multiple carriers • best prices",
  ],

  hotelDetails: [
    "4★ • walkable to venue",
    "3★ • near transit",
    "4★ • downtown area",
    "boutique • trendy neighborhood",
    "chain hotel • reliable option",
    "4★ • city center",
  ],
}

// =============================================================================
// Concert Example Generator
// =============================================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateConcertExample(): EventExample {
  const venue = pickRandom(CONCERTS_POOL.venues)
  const city = venue.city
  const month = pickRandom(CONCERTS_POOL.months)
  const genre = pickRandom(CONCERTS_POOL.genres)
  const descriptor = pickRandom(CONCERTS_POOL.descriptors)

  // Build a human-like query
  const queryTemplates = [
    `${genre} in ${city} ${month}`,
    `${descriptor} in ${city}`,
    `concerts in ${city} ${month}`,
    `live music in ${city} ${month}`,
    `${genre} near ${city}`,
  ]
  const query = pickRandom(queryTemplates)

  // Event name is generic
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

  // If flight is local ([0,0]), use "local" detail
  const flightDetail = flightRange[0] === 0 && flightRange[1] === 0
    ? "local • no flight needed"
    : pickRandom(CONCERTS_POOL.flightDetails)

  return {
    query,
    event,
    venue: `${venue.name}, ${city.charAt(0).toUpperCase() + city.slice(1)}`,
    date: pickRandom(CONCERTS_POOL.dateFormats),
    ticketRange,
    flightRange,
    hotelRange,
    ticketDetail: pickRandom(CONCERTS_POOL.ticketDetails),
    flightDetail,
    hotelDetail: pickRandom(CONCERTS_POOL.hotelDetails),
    nights: Math.random() > 0.3 ? 2 : 1,
  }
}

// =============================================================================
// Legacy Examples (Sports, Theater, Racing) - converted to new format
// =============================================================================

const SPORTS_EXAMPLES: EventExample[] = [
  { query: "lakers vs celtics in boston", event: "NBA Regular Season", venue: "TD Garden, Boston", date: "Feb 14, 2026", ticketRange: [250, 400], flightRange: [180, 300], hotelRange: [180, 280], ticketDetail: "lower bowl • good view", flightDetail: "nonstop • multiple options", hotelDetail: "4★ • downtown", nights: 2 },
  { query: "super bowl in new orleans", event: "Super Bowl LX", venue: "Caesars Superdome, New Orleans", date: "Feb 8, 2026", ticketRange: [3500, 5500], flightRange: [200, 350], hotelRange: [300, 500], ticketDetail: "lower level • prime section", flightDetail: "direct • limited seats", hotelDetail: "4★ • french quarter", nights: 3 },
  { query: "yankees vs red sox at fenway", event: "MLB Regular Season", venue: "Fenway Park, Boston", date: "Jul 4, 2026", ticketRange: [120, 220], flightRange: [100, 180], hotelRange: [180, 300], ticketDetail: "grandstand • classic view", flightDetail: "shuttle • hourly", hotelDetail: "boutique • back bay", nights: 2 },
  { query: "ufc 300 in vegas", event: "UFC 300", venue: "T-Mobile Arena, Las Vegas", date: "Apr 13, 2026", ticketRange: [350, 550], flightRange: [120, 220], hotelRange: [150, 280], ticketDetail: "lower bowl • cage view", flightDetail: "nonstop • cheap fares", hotelDetail: "casino hotel • on strip", nights: 2 },
]

const THEATER_EXAMPLES: EventExample[] = [
  { query: "hamilton on broadway nyc", event: "Hamilton", venue: "Richard Rodgers Theatre, NYC", date: "Mar 15, 2026", ticketRange: [280, 450], flightRange: [150, 280], hotelRange: [220, 380], ticketDetail: "orchestra • center section", flightDetail: "nonstop • evening arrival", hotelDetail: "4★ • times square area", nights: 2 },
  { query: "wicked in london west end", event: "Wicked", venue: "Apollo Victoria Theatre, London", date: "Apr 22, 2026", ticketRange: [140, 240], flightRange: [450, 700], hotelRange: [220, 380], ticketDetail: "stalls • front half", flightDetail: "direct • overnight", hotelDetail: "4★ • west end", nights: 3 },
  { query: "lion king broadway tickets", event: "The Lion King", venue: "Minskoff Theatre, NYC", date: "Jul 18, 2026", ticketRange: [150, 280], flightRange: [120, 240], hotelRange: [200, 350], ticketDetail: "mezzanine • center view", flightDetail: "nonstop • afternoon", hotelDetail: "boutique • midtown", nights: 2 },
]

const RACING_EXAMPLES: EventExample[] = [
  { query: "f1 monaco grand prix", event: "Formula 1 Monaco GP", venue: "Circuit de Monaco", date: "May 25, 2026", ticketRange: [700, 1200], flightRange: [550, 850], hotelRange: [350, 600], ticketDetail: "grandstand • harbor view", flightDetail: "1 stop • nice airport", hotelDetail: "4★ • monte carlo", nights: 3 },
  { query: "f1 austin texas gp", event: "Formula 1 US Grand Prix", venue: "Circuit of the Americas, Austin", date: "Oct 19, 2026", ticketRange: [380, 620], flightRange: [150, 280], hotelRange: [180, 320], ticketDetail: "turn 1 • great overtakes", flightDetail: "nonstop • multiple", hotelDetail: "4★ • downtown austin", nights: 2 },
  { query: "daytona 500 nascar race", event: "Daytona 500", venue: "Daytona International Speedway, FL", date: "Feb 15, 2026", ticketRange: [200, 380], flightRange: [120, 240], hotelRange: [140, 250], ticketDetail: "grandstand • start/finish", flightDetail: "direct • daytona", hotelDetail: "3★ • beachside", nights: 2 },
]

const EXAMPLES_BY_CATEGORY: Record<Category, EventExample[]> = {
  concerts: [], // Will use generator
  sports: SPORTS_EXAMPLES,
  theater: THEATER_EXAMPLES,
  racing: RACING_EXAMPLES,
}

// =============================================================================
// Constants
// =============================================================================

const CYCLE_INTERVAL = 8000
const ANIMATION_STEP_DELAY = 400

// =============================================================================
// Utility: Get example from category
// =============================================================================

function getRandomExample(category: Category): EventExample {
  if (category === "concerts") {
    return generateConcertExample()
  }
  const examples = EXAMPLES_BY_CATEGORY[category]
  return examples[Math.floor(Math.random() * examples.length)]
}

// =============================================================================
// Utility: Format price range
// =============================================================================

function formatRange(range: [number, number], prefix = "~$"): string {
  if (range[0] === 0 && range[1] === 0) {
    return "local"
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
// Animated Price Card with Hover Tooltip
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
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
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
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <span>{label}{suffix}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
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
  const [isGenerating, setIsGenerating] = useState(false)

  const totalRange = useMemo(() => {
    return computeTotalRange(
      current.ticketRange,
      current.flightRange,
      current.hotelRange,
      current.nights
    )
  }, [current])

  // Animation sequence
  const runAnimation = useCallback(() => {
    setAnimationStep(0)

    const t1 = setTimeout(() => setAnimationStep(1), 100)
    const t2 = setTimeout(() => setAnimationStep(2), ANIMATION_STEP_DELAY + 100)
    const t3 = setTimeout(() => setAnimationStep(3), ANIMATION_STEP_DELAY * 2 + 100)
    const t4 = setTimeout(() => setAnimationStep(4), ANIMATION_STEP_DELAY * 3 + 100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  // Run animation when current example changes
  useEffect(() => {
    const cleanup = runAnimation()
    return cleanup
  }, [current, runAnimation])

  // Auto-cycle examples
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(getRandomExample(activeCategory))
    }, CYCLE_INTERVAL)

    return () => clearInterval(interval)
  }, [activeCategory])

  // Handle category change
  function handleCategoryChange(category: Category) {
    if (category === activeCategory) return
    setActiveCategory(category)
    setCurrent(getRandomExample(category))
  }

  // Handle generate new
  function handleGenerate() {
    setIsGenerating(true)
    setCurrent(getRandomExample(activeCategory))
    setTimeout(() => setIsGenerating(false), 300)
  }

  // Determine phase for each card
  const ticketPhase: AnimationPhase = animationStep === 0 ? "idle" : animationStep === 1 ? "searching" : "found"
  const flightPhase: AnimationPhase = animationStep < 2 ? "idle" : animationStep === 2 ? "searching" : "found"
  const hotelPhase: AnimationPhase = animationStep < 3 ? "idle" : animationStep === 3 ? "searching" : "found"
  const showTotal = animationStep >= 4

  return (
    <TooltipProvider>
      <div className="w-full max-w-xl mx-auto">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-h-[36px]",
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

        {/* Preview Line (clickable to generate) */}
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer",
              "flex items-center gap-1.5",
              isGenerating && "opacity-50"
            )}
          >
            <span>sample itinerary</span>
            <span className="text-muted-foreground/40">—</span>
            <span className="flex items-center gap-1">
              <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
              <span>generate new</span>
            </span>
          </button>
        </div>

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

          {/* Animated Price Cards with Hover */}
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
              <div className="text-xs sm:text-sm text-muted-foreground">sample total</div>
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
              href={`/chat?prompt=${encodeURIComponent(`plan a trip for: ${current.query}`)}`}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-[0.97]",
                showTotal
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground pointer-events-none"
              )}
            >
              plan this trip
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>

          {/* Disclaimer */}
          {showTotal && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] sm:text-xs text-muted-foreground/50 text-center mt-4"
            >
              sample preview — real quotes appear after you search
            </motion.p>
          )}
        </motion.div>

        {/* Example Tags */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/60 mb-3">or try one of these</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {EXAMPLE_TAGS.map((tag) => (
              <Link
                key={tag.label}
                href={`/chat?prompt=${encodeURIComponent(tag.prompt)}`}
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
            href={`/chat?prompt=${encodeURIComponent(`plan a trip for: ${example.query}`)}`}
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
