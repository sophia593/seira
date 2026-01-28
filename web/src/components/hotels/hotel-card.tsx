'use client'

import { Star, MapPin, Bed, Users, Wifi, Car, Coffee, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { HotelOffer } from '@/hooks/use-hotel-search'

// =============================================================================
// Types
// =============================================================================

interface HotelCardProps {
  offer: HotelOffer
  onSelect?: (offer: HotelOffer) => void
  selected?: boolean
  className?: string
}

// =============================================================================
// Amenity Icons
// =============================================================================

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  'wifi': Wifi,
  'free wifi': Wifi,
  'internet': Wifi,
  'parking': Car,
  'free parking': Car,
  'breakfast': Coffee,
  'free breakfast': Coffee,
  'gym': Dumbbell,
  'fitness': Dumbbell,
  'fitness center': Dumbbell,
}

function getAmenityIcon(amenity: string) {
  const lower = amenity.toLowerCase()
  for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) {
      return Icon
    }
  }
  return null
}

// =============================================================================
// Component
// =============================================================================

export function HotelCard({
  offer,
  onSelect,
  selected = false,
  className,
}: HotelCardProps) {
  const {
    hotel_name,
    hotel_rating,
    address,
    distance_km,
    room_type,
    bed_type,
    guests,
    price,
    price_per_night,
    nights,
    amenities,
  } = offer

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card overflow-hidden transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        selected && 'ring-2 ring-primary border-primary',
        className
      )}
    >
      <div className="p-4 space-y-4">
        {/* Header - Name and Rating */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight mb-1 line-clamp-2 lowercase">
              {hotel_name}
            </h3>
            {hotel_rating && (
              <div className="flex items-center gap-1">
                {Array.from({ length: hotel_rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
                {Array.from({ length: 5 - hotel_rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 text-muted-foreground/30"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold">${Math.round(price)}</p>
            <p className="text-xs text-muted-foreground">
              {nights} night{nights !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Location */}
        {(address || distance_km) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              {address && <p className="line-clamp-1">{address}</p>}
              {distance_km && (
                <p className="text-xs">{distance_km.toFixed(1)} km from center</p>
              )}
            </div>
          </div>
        )}

        {/* Room details */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {bed_type && (
            <span className="flex items-center gap-1.5">
              <Bed className="w-4 h-4" />
              {formatBedType(bed_type)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {guests} guest{guests !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Price per night */}
        {price_per_night && (
          <p className="text-sm">
            <span className="font-medium">${Math.round(price_per_night)}</span>
            <span className="text-muted-foreground"> / night</span>
          </p>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.slice(0, 4).map((amenity, i) => {
              const Icon = getAmenityIcon(amenity)
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {amenity}
                </span>
              )
            })}
            {amenities.length > 4 && (
              <span className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                +{amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={() => onSelect?.(offer)}
          variant={selected ? 'default' : 'outline'}
          size="sm"
          className="w-full"
        >
          {selected ? 'Selected' : 'Select Hotel'}
        </Button>
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          ✓ Selected
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function formatBedType(bedType: string): string {
  const mapping: Record<string, string> = {
    'SINGLE': '1 Single',
    'DOUBLE': '1 Double',
    'TWIN': '2 Twin',
    'QUEEN': '1 Queen',
    'KING': '1 King',
    'CALIFORNIA_KING': '1 Cal King',
  }
  return mapping[bedType] || bedType.replace(/_/g, ' ').toLowerCase()
}
