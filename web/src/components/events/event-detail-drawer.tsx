'use client'

import { Calendar, MapPin, Ticket, ExternalLink, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { OptimizedImage } from '@/components/ui/optimized-image'
import type { EventResult } from '@/hooks/use-event-search'

// =============================================================================
// Types
// =============================================================================

interface EventDetailDrawerProps {
  event: EventResult | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (event: EventResult) => void
  isLoading?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function EventDetailDrawer({
  event,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: EventDetailDrawerProps) {
  if (!event) return null

  const { name, date, time, venue, price_range, image_url, purchase_url, genre, segment } = event

  const formattedDate = formatDate(date)
  const formattedTime = time ? formatTime(time) : null
  const venueDisplay = venue ? [venue.name, venue.city, venue.state].filter(Boolean).join(', ') : null
  const priceDisplay = price_range?.min
    ? price_range.max && price_range.max !== price_range.min
      ? `$${Math.round(price_range.min)} - $${Math.round(price_range.max)}`
      : `$${Math.round(price_range.min)}+`
    : null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col"
        showCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>Event details for {name}</DialogDescription>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image */}
          {image_url && (
            <div className="aspect-video overflow-hidden bg-muted relative">
              <OptimizedImage
                src={image_url}
                alt={name}
                fill
                priority
              />
            </div>
          )}

          <div className="px-6 pt-5 pb-4">
            {/* Event Name */}
            <h2 className="text-xl font-bold mb-3 lowercase leading-tight" aria-hidden="true">
              {name}
            </h2>

            {/* Category badge */}
            {(genre || segment) && (
              <div className="flex gap-2 mb-4">
                {segment && (
                  <span className="px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium">
                    {segment}
                  </span>
                )}
                {genre && genre !== segment && (
                  <span className="px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium">
                    {genre}
                  </span>
                )}
              </div>
            )}

            {/* Details */}
            <div className="space-y-3 mb-4">
              {/* Date & Time */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Calendar className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">{formattedDate}</p>
                    {formattedTime && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {formattedTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Venue */}
              {venueDisplay && (
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{venue?.name}</p>
                    {(venue?.city || venue?.state) && (
                      <p className="text-xs text-muted-foreground">
                        {[venue?.city, venue?.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              {priceDisplay && (
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Ticket className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{priceDisplay}</p>
                    <p className="text-xs text-muted-foreground">estimated ticket price</p>
                  </div>
                </div>
              )}
            </div>

            {/* External link */}
            {purchase_url && purchase_url !== '#' && (
              <a
                href={purchase_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                View on Ticketmaster
              </a>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-background">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11"
            >
              cancel
            </Button>
            <Button
              onClick={() => onConfirm(event)}
              disabled={isLoading}
              className="flex-1 h-11"
            >
              {isLoading ? 'creating trip...' : 'select this event'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
