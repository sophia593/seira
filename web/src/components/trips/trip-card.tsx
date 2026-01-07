'use client'

import Link from 'next/link'
import { Calendar, MapPin, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Trip } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface TripCardProps {
  trip: Trip
  className?: string
}

// =============================================================================
// Status Badge
// =============================================================================

const STATUS_STYLES: Record<Trip['status'], { bg: string; text: string }> = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground' },
  quoted: { bg: 'bg-primary/10', text: 'text-primary' },
  booked: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
  completed: { bg: 'bg-muted', text: 'text-muted-foreground' },
  cancelled: { bg: 'bg-destructive/10', text: 'text-destructive' },
}

function StatusBadge({ status }: { status: Trip['status'] }) {
  const styles = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium lowercase',
        styles.bg,
        styles.text
      )}
    >
      {status}
    </span>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function TripCard({ trip, className }: TripCardProps) {
  const {
    id,
    title,
    status,
    destination_city,
    destination_country,
    event_name,
    event_date,
    estimated_total,
  } = trip

  // Format destination
  const destination = [destination_city, destination_country]
    .filter(Boolean)
    .join(', ')

  // Format date: "sat, mar 15, 2025"
  const formattedDate = event_date ? formatDate(event_date) : null

  // Format price
  const formattedPrice = estimated_total
    ? `$${estimated_total.toLocaleString()}`
    : null

  return (
    <Link
      href={`/trips/${id}`}
      className={cn(
        'block rounded-xl border border-border/50 bg-card p-3 sm:p-4 shadow-sm',
        'hover:border-border hover:shadow-sm transition-colors duration-150',
        className
      )}
    >
      {/* Header: Title + Status */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h3 className="font-medium lowercase line-clamp-1 text-sm sm:text-base">
          {title || event_name || 'untitled trip'}
        </h3>
        <StatusBadge status={status} />
      </div>

      {/* Event name (if different from title) */}
      {event_name && title && event_name !== title && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-1 lowercase">
          {event_name}
        </p>
      )}

      {/* Details */}
      <div className="space-y-1.5">
        {/* Destination */}
        {destination && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="lowercase">{destination}</span>
          </div>
        )}

        {/* Date */}
        {formattedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Footer: Price */}
      {formattedPrice && (
        <div className="flex items-center gap-2 text-sm font-medium mt-3 pt-3 border-t border-border/50">
          <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
          <span>{formattedPrice} estimated</span>
        </div>
      )}
    </Link>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toLowerCase()
}
