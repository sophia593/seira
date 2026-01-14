'use client'

import { useState } from 'react'
import { Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { HotelDetailCard } from './hotel-detail-card'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface Hotel {
  id: string
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  star_rating?: number | null
  user_rating?: number | null
  review_count?: number | null
  price_per_night?: number | null
  total_price?: number | null
  currency?: string
  check_in_date?: string | null
  check_out_date?: string | null
  nights?: number | null
  image_url?: string | null
  booking_url?: string | null
  amenities?: { id: string; name: string }[] | string[] | null
  room_type?: string | null
}

interface HotelsSectionProps {
  hotels: Hotel[]
  title?: string
  className?: string
  initialDisplayCount?: number
  collapsible?: boolean
  defaultExpanded?: boolean
}

// =============================================================================
// Main Component
// =============================================================================

export function HotelsSection({
  hotels,
  title = 'hotels',
  className,
  initialDisplayCount = 3,
  collapsible = true,
  defaultExpanded = true,
}: HotelsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showAll, setShowAll] = useState(false)

  if (!hotels || hotels.length === 0) {
    return null
  }

  const displayedHotels = showAll
    ? hotels
    : hotels.slice(0, initialDisplayCount)

  const hasMore = hotels.length > initialDisplayCount
  const remainingCount = hotels.length - initialDisplayCount

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <button
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        disabled={!collapsible}
        className={cn(
          'flex items-center justify-between w-full',
          collapsible && 'cursor-pointer hover:opacity-80 transition-opacity'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold lowercase">{title}</h3>
          <span className="text-xs text-muted-foreground">
            ({hotels.length} option{hotels.length !== 1 ? 's' : ''})
          </span>
        </div>

        {collapsible && (
          <div className="p-1 rounded-md hover:bg-muted transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Hotel Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedHotels.map((hotel) => (
              <HotelDetailCard key={hotel.id} hotel={hotel} />
            ))}
          </div>

          {/* Show More / Show Less */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={cn(
                'w-full py-2.5 px-4 rounded-xl border bg-card',
                'hover:bg-muted/50 transition-colors',
                'flex items-center justify-center gap-2',
                'text-sm text-muted-foreground hover:text-foreground'
              )}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  show {remainingCount} more hotel{remainingCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Empty State Export
// =============================================================================

export function HotelsSectionEmpty({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border bg-card p-6 text-center', className)}>
      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <Building2 className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        no hotels added yet
      </p>
    </div>
  )
}
