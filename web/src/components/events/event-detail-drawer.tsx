'use client'

import { useState } from 'react'
import { Calendar, MapPin, Ticket, ExternalLink, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl shadow-xl transition-transform duration-300 ease-out',
          'max-h-[85vh] overflow-hidden flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-muted" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2.5 rounded-full hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Image */}
          {image_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-6 -mx-2">
              <img
                src={image_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Name */}
          <h2 className="text-2xl font-bold mb-4 lowercase leading-tight">
            {name}
          </h2>

          {/* Category badge */}
          {(genre || segment) && (
            <div className="flex gap-2 mb-4">
              {segment && (
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                  {segment}
                </span>
              )}
              {genre && genre !== segment && (
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                  {genre}
                </span>
              )}
            </div>
          )}

          {/* Details */}
          <div className="space-y-4 mb-6">
            {/* Date & Time - Highlighted */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{formattedDate}</p>
                  {formattedTime && (
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="w-4 h-4" />
                      {formattedTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Venue */}
            {venueDisplay && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{venue?.name}</p>
                  {(venue?.city || venue?.state) && (
                    <p className="text-sm text-muted-foreground">
                      {[venue?.city, venue?.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {venue?.address && (
                    <p className="text-sm text-muted-foreground">{venue.address}</p>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            {priceDisplay && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Ticket className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{priceDisplay}</p>
                  <p className="text-sm text-muted-foreground">estimated ticket price</p>
                </div>
              </div>
            )}
          </div>

          {/* External link */}
          {purchase_url && (
            <a
              href={purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ExternalLink className="w-4 h-4" />
              View on Ticketmaster
            </a>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t bg-background pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
            >
              cancel
            </Button>
            <Button
              onClick={() => onConfirm(event)}
              disabled={isLoading}
              className="flex-1 h-12"
            >
              {isLoading ? 'creating trip...' : 'select this event'}
            </Button>
          </div>
        </div>
      </div>
    </>
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
