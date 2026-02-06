'use client'

import { useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Plane,
  Hotel as HotelIcon,
  Home,
  DollarSign,
  Share2,
  Bookmark,
  PlaneTakeoff,
  PlaneLanding,
  Building2,
  Car,
  MapPinned,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SAMPLE_PLAN } from '@/lib/sample-plan-data'
import type { FlightTimingTag, FlightOption, HotelOption } from '@/types/plan'

// =============================================================================
// Types
// =============================================================================

interface TimelineStep {
  type: 'origin' | 'flight' | 'hotel' | 'event' | 'return' | 'home'
  title: string
  subtitle?: string
  time?: string
  date?: string
  icon: React.ReactNode
  data?: any
}

// =============================================================================
// Tag Styling
// =============================================================================

const TIMING_TAG_STYLES: Record<FlightTimingTag, { bg: string; text: string; label: string }> = {
  arrives_day_before: { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-400',
    label: 'arrives day before'
  },
  arrives_morning_of: { 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-400',
    label: 'arrives morning of'
  },
  arrives_before_event: { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-400',
    label: 'good buffer'
  },
  arrives_tight: { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-700 dark:text-red-400',
    label: 'cutting it close'
  },
  arrives_after_event: { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-700 dark:text-red-400',
    label: 'arrives after event'
  },
  departs_next_morning: { 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-400',
    label: 'next morning'
  },
  departs_same_night: { 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-400',
    label: 'same night'
  },
  departs_day_after: { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-400',
    label: 'day after'
  },
}

// =============================================================================
// Main Component
// =============================================================================

export default function PlanArtifactPage() {
  const plan = SAMPLE_PLAN
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)

  // Get selected flight or default to first one for display
  const displayFlight = plan.flight_options[0]
  
  // Calculate total estimated cost
  const totalEstimatedCost = (plan.event.price_estimate || 0) + 
    (displayFlight?.price || 0) + 
    (plan.hotel_options[0]?.price || 0) +
    (plan.ground_transport?.total_estimate || 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <StickyHeader 
        eventName={plan.event.name}
        eventDate={plan.event.date}
        eventTime={plan.event.time}
        venueName={plan.event.venue_name}
        totalCost={totalEstimatedCost}
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 pt-32 pb-32">
        {/* Timeline */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 lowercase">your trip timeline</h2>
          <Timeline plan={plan} displayFlight={displayFlight} />
        </section>

        {/* Flight Options - The Differentiator */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 lowercase">
            flight options
            <span className="text-sm font-normal text-muted-foreground ml-2">
              with seira logic tags
            </span>
          </h2>
          <div className="space-y-4">
            {plan.flight_options.map((flight) => (
              <FlightCard 
                key={flight.id} 
                flight={flight}
                isSelected={selectedFlightId === flight.id}
                onSelect={() => setSelectedFlightId(flight.id)}
              />
            ))}
          </div>
        </section>

        {/* Hotel Options */}
        <section className="mb-12">
          <HotelSection 
            hotels={plan.hotel_options}
            venueLocation={{ 
              lat: plan.event.venue_lat!, 
              lng: plan.event.venue_lng! 
            }}
            selectedHotelId={selectedHotelId}
            onSelectHotel={setSelectedHotelId}
          />
        </section>

        {/* Ground Transport */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 lowercase">ground transport</h2>
          <GroundTransportCard transport={plan.ground_transport!} />
        </section>
      </div>

      {/* Sticky Bottom Bar */}
      <BottomActionBar />
    </div>
  )
}

// =============================================================================
// Sticky Header
// =============================================================================

interface StickyHeaderProps {
  eventName: string
  eventDate: string
  eventTime: string | null
  venueName: string | null
  totalCost: number
}

function StickyHeader({ eventName, eventDate, eventTime, venueName, totalCost }: StickyHeaderProps) {
  const formattedDate = formatDate(eventDate)
  const formattedTime = eventTime ? formatTime(eventTime) : null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Event Info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold lowercase truncate">
              {eventName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              {formattedTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formattedTime}
                </span>
              )}
              {venueName && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {venueName}
                </span>
              )}
            </div>
          </div>

          {/* Total Cost */}
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Est. Cost</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              ${totalCost.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

// =============================================================================
// Timeline
// =============================================================================

interface TimelineProps {
  plan: typeof SAMPLE_PLAN
  displayFlight: FlightOption
}

function Timeline({ plan, displayFlight }: TimelineProps) {
  const steps: TimelineStep[] = [
    {
      type: 'origin',
      title: plan.origin.city || 'Home',
      subtitle: plan.origin.airport_code,
      icon: <Home className="w-5 h-5" />,
    },
    {
      type: 'flight',
      title: 'Outbound Flight',
      subtitle: `${displayFlight.outbound_segments[0].carrier_name} ${displayFlight.outbound_segments[0].flight_number}`,
      time: formatTime(displayFlight.outbound_segments[0].departure_time.split('T')[1]),
      date: formatDate(displayFlight.outbound_segments[0].departure_time.split('T')[0]),
      icon: <PlaneTakeoff className="w-5 h-5" />,
      data: displayFlight,
    },
    {
      type: 'hotel',
      title: 'Check-in',
      subtitle: plan.hotel_options[0].name,
      date: formatDate(plan.hotel_options[0].check_in),
      icon: <HotelIcon className="w-5 h-5" />,
    },
    {
      type: 'event',
      title: plan.event.name,
      subtitle: plan.event.venue_name || undefined,
      time: plan.event.time ? formatTime(plan.event.time) : undefined,
      date: formatDate(plan.event.date),
      icon: <MapPinned className="w-5 h-5" />,
    },
    {
      type: 'return',
      title: 'Return Flight',
      subtitle: displayFlight.return_segments?.[0] 
        ? `${displayFlight.return_segments[0].carrier_name} ${displayFlight.return_segments[0].flight_number}`
        : undefined,
      time: displayFlight.return_segments?.[0] 
        ? formatTime(displayFlight.return_segments[0].departure_time.split('T')[1])
        : undefined,
      date: displayFlight.return_segments?.[0]
        ? formatDate(displayFlight.return_segments[0].departure_time.split('T')[0])
        : undefined,
      icon: <PlaneLanding className="w-5 h-5" />,
    },
    {
      type: 'home',
      title: plan.origin.city || 'Home',
      subtitle: plan.origin.airport_code,
      icon: <Home className="w-5 h-5" />,
    },
  ]

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-border" />

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="relative flex gap-4">
            {/* Icon */}
            <div className={cn(
              "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0",
              step.type === 'event' 
                ? "bg-primary border-primary text-primary-foreground" 
                : "bg-background border-border"
            )}>
              {step.icon}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold lowercase">{step.title}</h3>
                  {step.subtitle && (
                    <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                  )}
                </div>
                {(step.time || step.date) && (
                  <div className="text-right text-sm shrink-0">
                    {step.date && <p className="font-medium">{step.date}</p>}
                    {step.time && <p className="text-muted-foreground">{step.time}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Flight Card
// =============================================================================

interface FlightCardProps {
  flight: FlightOption
  isSelected: boolean
  onSelect: () => void
}

function FlightCard({ flight, isSelected, onSelect }: FlightCardProps) {
  const outbound = flight.outbound_segments[0]
  const outboundLast = flight.outbound_segments[flight.outbound_segments.length - 1]
  const returnSeg = flight.return_segments?.[0]
  
  // Get the primary timing tag
  const primaryTag = flight.outbound_timing_tags[0]
  const tagStyle = primaryTag ? TIMING_TAG_STYLES[primaryTag] : null

  return (
    <div 
      className={cn(
        "rounded-xl border bg-card p-4 sm:p-5 transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      {/* Outbound */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">outbound</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">${flight.price}</p>
            <p className="text-xs text-muted-foreground">round-trip</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-2xl font-bold">{outbound.departure_time.split('T')[1].slice(0, 5)}</p>
            <p className="text-sm text-muted-foreground">{outbound.departure_airport}</p>
          </div>
          <div className="flex-1 px-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <Plane className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{flight.outbound_duration_formatted}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{outboundLast.arrival_time.split('T')[1].slice(0, 5)}</p>
              {/* Seira Tag - The Differentiator */}
              {tagStyle && (
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
                  tagStyle.bg,
                  tagStyle.text
                )}>
                  {tagStyle.label}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{outboundLast.arrival_airport}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{outbound.carrier_name}</span>
          <span>•</span>
          <span>{outbound.flight_number}</span>
          <span>•</span>
          <span>{flight.is_nonstop ? 'nonstop' : `${flight.outbound_stops} stop`}</span>
        </div>
      </div>

      {/* Return */}
      {returnSeg && (
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <PlaneLanding className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">return</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-2xl font-bold">{returnSeg.departure_time.split('T')[1].slice(0, 5)}</p>
              <p className="text-sm text-muted-foreground">{returnSeg.departure_airport}</p>
            </div>
            <div className="flex-1 px-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <Plane className="w-4 h-4 text-muted-foreground rotate-180" />
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{flight.return_duration_formatted}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{returnSeg.arrival_time.split('T')[1].slice(0, 5)}</p>
              <p className="text-sm text-muted-foreground">{returnSeg.arrival_airport}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{returnSeg.carrier_name}</span>
            <span>•</span>
            <span>{returnSeg.flight_number}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Hotel Section
// =============================================================================

interface HotelSectionProps {
  hotels: HotelOption[]
  venueLocation: { lat: number; lng: number }
  selectedHotelId: string | null
  onSelectHotel: (id: string) => void
}

function HotelSection({ hotels, venueLocation, selectedHotelId, onSelectHotel }: HotelSectionProps) {
  // Group hotels by distance
  const walkingDistance = hotels.filter(h => h.venue_distance_km! <= 2)
  const bestValue = hotels.filter(h => h.venue_distance_km! > 2)

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 lowercase">hotels</h2>
      
      {/* Walking Distance */}
      {walkingDistance.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-700 dark:text-green-400 lowercase">
              walking distance
            </h3>
            <span className="text-xs text-muted-foreground">(&lt; 2km from venue)</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {walkingDistance.map(hotel => (
              <HotelCard 
                key={hotel.id}
                hotel={hotel}
                isSelected={selectedHotelId === hotel.id}
                onSelect={() => onSelectHotel(hotel.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Best Value */}
      {bestValue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-700 dark:text-amber-400 lowercase">
              best value
            </h3>
            <span className="text-xs text-muted-foreground">(further from venue)</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {bestValue.map(hotel => (
              <HotelCard 
                key={hotel.id}
                hotel={hotel}
                isSelected={selectedHotelId === hotel.id}
                onSelect={() => onSelectHotel(hotel.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Hotel Card
// =============================================================================

interface HotelCardProps {
  hotel: HotelOption
  isSelected: boolean
  onSelect: () => void
}

function HotelCard({ hotel, isSelected, onSelect }: HotelCardProps) {
  return (
    <div 
      className={cn(
        "rounded-xl border bg-card p-4 transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h4 className="font-semibold lowercase mb-1">{hotel.name}</h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {'★'.repeat(hotel.star_rating || 0)}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">${hotel.price}</p>
          <p className="text-xs text-muted-foreground">{hotel.nights} nights</p>
        </div>
      </div>

      {/* Distance */}
      <div className="flex items-center gap-1.5 text-sm mb-3">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-medium">{hotel.venue_distance_formatted}</span>
        <span className="text-muted-foreground">to venue</span>
      </div>

      {/* Amenities */}
      <div className="flex flex-wrap gap-1.5">
        {hotel.amenities.slice(0, 4).map((amenity, i) => (
          <span 
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
          >
            {amenity}
          </span>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Ground Transport Card
// =============================================================================

interface GroundTransportCardProps {
  transport: NonNullable<typeof SAMPLE_PLAN.ground_transport>
}

function GroundTransportCard({ transport }: GroundTransportCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold lowercase mb-1">estimated uber / lyft costs</h3>
          <p className="text-sm text-muted-foreground">
            based on typical rates in the area
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">${transport.total_estimate}</p>
          <p className="text-xs text-muted-foreground">
            ${transport.total_range?.min} - ${transport.total_range?.max}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {transport.legs.map((leg, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
            <div className="flex items-center gap-3">
              <Car className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">
                  {leg.type.replace(/_/g, ' ')}
                </p>
                {leg.notes && (
                  <p className="text-xs text-muted-foreground">{leg.notes}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">${leg.price_estimate}</p>
              <p className="text-xs text-muted-foreground">
                {leg.duration_minutes} min
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Bottom Action Bar
// =============================================================================

function BottomActionBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <Button className="flex-1" size="lg">
            <Share2 className="w-4 h-4 mr-2" />
            share plan
          </Button>
          <Button variant="outline" size="lg" className="flex-1">
            <Bookmark className="w-4 h-4 mr-2" />
            save
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toLowerCase()
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase()
}
