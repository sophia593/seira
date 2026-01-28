'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Plane,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { getApi, type Trip } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { EmailVerificationPrompt } from '@/components/email-verification-prompt'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// =============================================================================
// Types
// =============================================================================

type FilterType = 'all' | 'upcoming' | 'past'

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'upcoming', label: 'upcoming' },
  { value: 'past', label: 'past' },
]

// =============================================================================
// Helpers
// =============================================================================

function getEventDate(trip: Trip): Date | null {
  if (trip.event_date) {
    return new Date(trip.event_date + 'T00:00:00')
  }
  return null
}

function getDaysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDaysUntil(days: number): string {
  if (days < 0) return `${Math.abs(days)} days ago`
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days <= 7) return `in ${days} days`
  if (days <= 30) return `in ${Math.ceil(days / 7)} weeks`
  return `in ${Math.ceil(days / 30)} months`
}

function isUpcoming(trip: Trip): boolean {
  const date = getEventDate(trip)
  if (!date) return true // No date = treat as upcoming
  return getDaysUntil(date) >= 0
}

function sortByEventDate(trips: Trip[]): Trip[] {
  return [...trips].sort((a, b) => {
    const dateA = getEventDate(a)
    const dateB = getEventDate(b)

    // No date = sort to end
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1

    return dateA.getTime() - dateB.getTime()
  })
}

function getDestination(trip: Trip): string | null {
  const parts = [trip.destination_city, trip.destination_country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

// =============================================================================
// Trip Card Component
// =============================================================================

interface TripCardProps {
  trip: Trip
  onDelete: (id: string) => void
  isDeleting: boolean
  isHero?: boolean
}

function TripCard({ trip, onDelete, isDeleting, isHero = false }: TripCardProps) {
  const eventDate = getEventDate(trip)
  const daysUntil = eventDate ? getDaysUntil(eventDate) : null
  const isUpcomingTrip = daysUntil !== null && daysUntil >= 0
  const destination = getDestination(trip)

  // Status badge
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'draft', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    quoted: { label: 'ready to book', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    booked: { label: 'booked', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    completed: { label: 'completed', className: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  }

  const status = statusConfig[trip.status || 'draft'] || statusConfig.draft

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card transition-all duration-200',
        isHero
          ? 'p-6 shadow-md border-primary/20'
          : 'p-4 hover:shadow-md hover:border-primary/20',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete(trip.id)
        }}
        className={cn(
          'absolute top-3 right-3 p-2 rounded-lg',
          'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          'opacity-0 group-hover:opacity-100 focus:opacity-100',
          'transition-all duration-150'
        )}
        title="Delete trip"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <Link href={`/trips/${trip.id}`} className="block">
        {/* Hero badge */}
        {isHero && isUpcomingTrip && daysUntil !== null && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Calendar className="w-3 h-3" />
            {formatDaysUntil(daysUntil)}
          </div>
        )}

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-2 pr-8">
          <h3 className={cn(
            'font-medium lowercase line-clamp-2',
            isHero ? 'text-lg' : 'text-base'
          )}>
            {trip.title || trip.event_name || 'untitled trip'}
          </h3>
        </div>

        {/* Event info */}
        {trip.event_name && trip.title && trip.event_name !== trip.title && (
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {trip.event_name}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {destination && (
            <span className="flex items-center gap-1.5 lowercase">
              <MapPin className="w-3.5 h-3.5" />
              {destination}
            </span>
          )}
          {eventDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).toLowerCase()}
            </span>
          )}
        </div>

        {/* Bottom row: status + CTA */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', status.className)}>
            {status.label}
          </span>

          {/* Contextual CTA */}
          {isHero && (
            <span className="flex items-center gap-1 text-sm text-primary font-medium">
              {trip.status === 'draft' || trip.status === 'quoted' ? (
                <>continue booking <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <>view details <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ filter }: { filter: FilterType }) {
  if (filter !== 'all') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">no {filter} trips</p>
      </div>
    )
  }

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
        <Plane className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium mb-2 lowercase">no trips yet</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
        start planning your next adventure — tell us about an event you want to attend
      </p>
      <Button asChild className="lowercase">
        <Link href="/search">
          <Plus className="w-4 h-4 mr-2" />
          plan your first trip
        </Link>
      </Button>
    </div>
  )
}

// =============================================================================
// Loading State
// =============================================================================

function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border bg-card p-4 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="h-5 w-2/3 bg-muted rounded mb-3" />
          <div className="h-4 w-1/2 bg-muted rounded mb-3" />
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Error State
// =============================================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive/50" />
      <h3 className="font-medium mb-2 lowercase">couldn't load trips</h3>
      <p className="text-muted-foreground text-sm mb-4">
        something went wrong, please try again
      </p>
      <Button onClick={onRetry} variant="outline" className="lowercase">
        try again
      </Button>
    </div>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function TripsPage() {
  const { isEmailVerified, loading: authLoading } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  async function fetchTrips() {
    setIsLoading(true)
    setError(null)
    try {
      const api = getApi()
      const data = await api.getTrips()
      setTrips(data)
    } catch {
      setError('failed to load trips')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  // Handle delete
  function handleDeleteClick(id: string) {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const api = getApi()
      await api.deleteTrip(deleteId)
      setTrips((prev) => prev.filter((t) => t.id !== deleteId))
      toast.success('trip deleted')
    } catch {
      toast.error('couldn\'t delete trip')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteId(null)
    }
  }

  // Sort and filter trips
  const { sortedTrips, upcomingTrips, pastTrips, nextTrip } = useMemo(() => {
    const sorted = sortByEventDate(trips)
    const upcoming = sorted.filter(isUpcoming)
    const past = sorted.filter((t) => !isUpcoming(t))
    const next = upcoming[0] || null

    return {
      sortedTrips: sorted,
      upcomingTrips: upcoming,
      pastTrips: past,
      nextTrip: next,
    }
  }, [trips])

  // Apply filter
  const filteredTrips = useMemo(() => {
    if (activeFilter === 'upcoming') return upcomingTrips
    if (activeFilter === 'past') return pastTrips
    return sortedTrips
  }, [activeFilter, sortedTrips, upcomingTrips, pastTrips])

  // Exclude hero trip from list when showing "all" or "upcoming"
  const listTrips = useMemo(() => {
    if (!nextTrip || activeFilter === 'past') return filteredTrips
    return filteredTrips.filter((t) => t.id !== nextTrip.id)
  }, [filteredTrips, nextTrip, activeFilter])

  // Counts
  const counts = {
    all: trips.length,
    upcoming: upcomingTrips.length,
    past: pastTrips.length,
  }

  // Show verification prompt if not verified (and not still loading auth)
  if (!authLoading && !isEmailVerified) {
    return (
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold lowercase">trips</h1>
            <p className="text-sm text-muted-foreground mt-1">
              your upcoming and past travel plans
            </p>
          </div>

          {/* Verification Prompt */}
          <div className="rounded-3xl border bg-card shadow-lg">
            <EmailVerificationPrompt
              title="verify your email to view trips"
              description="once verified, you can save and manage your travel plans"
            />
          </div>

          {/* CTA to continue exploring */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              in the meantime, you can still explore
            </p>
            <Button asChild variant="outline" className="lowercase">
              <Link href="/search">
                <Plus className="w-4 h-4 mr-2" />
                plan a trip
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold lowercase">trips</h1>
            <p className="text-sm text-muted-foreground mt-1">
              your upcoming and past travel plans
            </p>
          </div>
          <Button asChild className="lowercase w-full sm:w-auto">
            <Link href="/search">
              <Plus className="w-4 h-4 mr-2" />
              plan a trip
            </Link>
          </Button>
        </div>

        {/* Content */}
        {(isLoading || authLoading) ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={fetchTrips} />
        ) : trips.length === 0 ? (
          <EmptyState filter="all" />
        ) : (
          <>
            {/* Next Trip Hero (only if upcoming exists and not filtering past) */}
            {nextTrip && activeFilter !== 'past' && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-3 lowercase">
                  your next trip
                </h2>
                <TripCard
                  trip={nextTrip}
                  onDelete={handleDeleteClick}
                  isDeleting={isDeleting && deleteId === nextTrip.id}
                  isHero
                />
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors lowercase',
                    activeFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  {filter.label}
                  <span className="ml-1.5 opacity-70">({counts[filter.value]})</span>
                </button>
              ))}
            </div>

            {/* Trip List */}
            {listTrips.length === 0 ? (
              <EmptyState filter={activeFilter} />
            ) : (
              <div className="space-y-3">
                {activeFilter === 'all' && upcomingTrips.length > 1 && (
                  <h2 className="text-sm font-medium text-muted-foreground lowercase pt-2">
                    other upcoming trips
                  </h2>
                )}
                {activeFilter === 'all' && pastTrips.length > 0 && listTrips.some(t => !isUpcoming(t)) && (
                  <>
                    {/* Show remaining upcoming first */}
                    {listTrips.filter(isUpcoming).map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onDelete={handleDeleteClick}
                        isDeleting={isDeleting && deleteId === trip.id}
                      />
                    ))}

                    {/* Past trips section */}
                    {listTrips.some(t => !isUpcoming(t)) && (
                      <h2 className="text-sm font-medium text-muted-foreground lowercase pt-4">
                        past trips
                      </h2>
                    )}
                    {listTrips.filter(t => !isUpcoming(t)).map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onDelete={handleDeleteClick}
                        isDeleting={isDeleting && deleteId === trip.id}
                      />
                    ))}
                  </>
                )}

                {/* When filtering, just show the list */}
                {activeFilter !== 'all' && listTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onDelete={handleDeleteClick}
                    isDeleting={isDeleting && deleteId === trip.id}
                  />
                ))}

                {/* When showing all and no past trips */}
                {activeFilter === 'all' && pastTrips.length === 0 && listTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onDelete={handleDeleteClick}
                    isDeleting={isDeleting && deleteId === trip.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="lowercase">delete trip?</AlertDialogTitle>
            <AlertDialogDescription>
              this will permanently delete this trip and all its details.
              this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="lowercase">cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 lowercase"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  deleting...
                </>
              ) : (
                'delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
