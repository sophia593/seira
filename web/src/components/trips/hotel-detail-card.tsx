'use client'

import {
  Building2,
  MapPin,
  Star,
  Calendar,
  ExternalLink,
  Wifi,
  Car,
  Coffee,
  Waves
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface HotelAmenity {
  id: string
  name: string
}

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
  amenities?: HotelAmenity[] | string[] | null
  room_type?: string | null
}

interface HotelDetailCardProps {
  hotel: Hotel
  className?: string
  compact?: boolean
}

// =============================================================================
// Amenity Icons
// =============================================================================

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  pool: Waves,
}

function getAmenityIcon(amenity: string): React.ElementType {
  const lower = amenity.toLowerCase()
  if (lower.includes('wifi') || lower.includes('internet')) return Wifi
  if (lower.includes('parking')) return Car
  if (lower.includes('breakfast') || lower.includes('coffee')) return Coffee
  if (lower.includes('pool') || lower.includes('swim')) return Waves
  return Building2
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function formatLocation(hotel: Hotel): string {
  const parts = [hotel.city, hotel.state, hotel.country].filter(Boolean)
  return parts.join(', ') || 'Location not specified'
}

// =============================================================================
// Star Rating Component
// =============================================================================

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function HotelDetailCard({
  hotel,
  className,
  compact = false,
}: HotelDetailCardProps) {
  const hasImage = !!hotel.image_url
  const hasAmenities = hotel.amenities && hotel.amenities.length > 0

  // Normalize amenities to string array
  const amenityNames: string[] = hotel.amenities
    ? hotel.amenities.map((a) => (typeof a === 'string' ? a : a.name))
    : []

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card overflow-hidden',
        'transition-all duration-200 hover:shadow-md hover:border-primary/20',
        className
      )}
    >
      {/* Image */}
      {hasImage && !compact && (
        <div className="relative h-40 bg-muted">
          <img
            src={hotel.image_url!}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          {/* Price badge */}
          {hotel.price_per_night && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-sm">
              <span className="text-sm font-semibold">
                {formatPrice(hotel.price_per_night, hotel.currency)}
              </span>
              <span className="text-xs text-muted-foreground">/night</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate lowercase">
              {hotel.name}
            </h3>
            {hotel.star_rating && (
              <div className="mt-1">
                <StarRating rating={hotel.star_rating} />
              </div>
            )}
          </div>

          {/* Price (if no image or compact) */}
          {(compact || !hasImage) && hotel.price_per_night && (
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold">
                {formatPrice(hotel.price_per_night, hotel.currency)}
              </div>
              <div className="text-xs text-muted-foreground">/night</div>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{formatLocation(hotel)}</span>
        </div>

        {/* Dates */}
        {(hotel.check_in_date || hotel.check_out_date) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              {hotel.check_in_date && formatDate(hotel.check_in_date)}
              {hotel.check_in_date && hotel.check_out_date && ' → '}
              {hotel.check_out_date && formatDate(hotel.check_out_date)}
              {hotel.nights && (
                <span className="text-muted-foreground/70">
                  {' '}({hotel.nights} night{hotel.nights !== 1 ? 's' : ''})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Room type */}
        {hotel.room_type && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="lowercase">{hotel.room_type}</span>
          </div>
        )}

        {/* User rating */}
        {hotel.user_rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
              {hotel.user_rating.toFixed(1)}
            </div>
            {hotel.review_count && (
              <span className="text-xs text-muted-foreground">
                ({hotel.review_count.toLocaleString()} reviews)
              </span>
            )}
          </div>
        )}

        {/* Amenities */}
        {hasAmenities && !compact && (
          <div className="flex flex-wrap gap-2 mb-4">
            {amenityNames.slice(0, 4).map((amenity, i) => {
              const Icon = getAmenityIcon(amenity)
              return (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground"
                >
                  <Icon className="w-3 h-3" />
                  <span className="lowercase">{amenity}</span>
                </div>
              )
            })}
            {amenityNames.length > 4 && (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                +{amenityNames.length - 4} more
              </div>
            )}
          </div>
        )}

        {/* Total price */}
        {hotel.total_price && (
          <div className="flex items-center justify-between py-2 border-t mb-3">
            <span className="text-xs text-muted-foreground">total</span>
            <span className="text-sm font-semibold">
              {formatPrice(hotel.total_price, hotel.currency)}
            </span>
          </div>
        )}

        {/* Booking link */}
        {hotel.booking_url && (
          <a
            href={hotel.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center justify-center gap-2 w-full',
              'px-4 py-2.5 rounded-xl',
              'bg-primary text-primary-foreground',
              'text-sm font-medium lowercase',
              'hover:bg-primary/90 transition-colors'
            )}
          >
            book now
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Compact Variant Export
// =============================================================================

export function HotelDetailCardCompact(props: Omit<HotelDetailCardProps, 'compact'>) {
  return <HotelDetailCard {...props} compact />
}
