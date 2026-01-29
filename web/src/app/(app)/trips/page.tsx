'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Plane,
  ArrowRight,
  Loader2,
  AlertCircle,
  Share2,
  Eye,
  Pencil,
  Copy,
  Check,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// =============================================================================
// Types
// =============================================================================

type FilterType = 'all' | 'planning' | 'ready' | 'booked' | 'past'

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'planning', label: 'Planning' },
  { value: 'ready', label: 'Ready' },
  { value: 'booked', label: 'Booked' },
  { value: 'past', label: 'Past' },
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

function isPastTrip(trip: Trip): boolean {
  const date = getEventDate(trip)
  if (!date) return false
  return getDaysUntil(date) < 0
}

function getFilterForTrip(trip: Trip): FilterType {
  // Past trips (event date has passed)
  if (isPastTrip(trip)) return 'past'

  // Status-based categorization
  if (trip.status === 'booked' || trip.status === 'completed') return 'booked'
  if (trip.status === 'quoted') return 'ready'

  // Draft = planning
  return 'planning'
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
// Status Badge
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: {
      label: 'planning',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    },
    quoted: {
      label: 'ready',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    booked: {
      label: 'booked',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    },
    completed: {
      label: 'completed',
      className: 'bg-muted text-muted-foreground'
    },
    cancelled: {
      label: 'cancelled',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    },
  }

  const { label, className } = config[status] || config.draft

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  )
}

// =============================================================================
// Trip Card Component
// =============================================================================

interface TripCardProps {
  trip: Trip
  onDelete: (id: string) => void
  onShare: (trip: Trip) => void
  isDeleting: boolean
}

function TripCard({ trip, onDelete, onShare, isDeleting }: TripCardProps) {
  const router = useRouter()
  const eventDate = getEventDate(trip)
  const daysUntil = eventDate ? getDaysUntil(eventDate) : null
  const destination = getDestination(trip)
  const isPast = isPastTrip(trip)

  // Determine primary action
  const primaryAction = isPast || trip.status === 'booked' || trip.status === 'completed'
    ? { label: 'View', icon: Eye, href: `/trip/${trip.id}/review` }
    : { label: 'Continue', icon: Pencil, href: `/trip/${trip.id}` }

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-card p-4 sm:p-5 transition-all duration-200',
        'hover:shadow-md hover:border-primary/20',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Main content - clickable */}
      <Link href={primaryAction.href} className="block">
        {/* Top row: Event name + countdown */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 lowercase">
              {trip.event_name || trip.title || 'untitled trip'}
            </h3>
            {trip.event_name && trip.title && trip.event_name !== trip.title && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {trip.title}
              </p>
            )}
          </div>

          {/* Countdown badge */}
          {daysUntil !== null && !isPast && (
            <div className={cn(
              'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium',
              daysUntil <= 7
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              {formatDaysUntil(daysUntil)}
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground mb-4">
          {destination && (
            <span className="flex items-center gap-1.5 lowercase">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{destination}</span>
            </span>
          )}
          {eventDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }).toLowerCase()}
            </span>
          )}
        </div>

        {/* Bottom row: Status + Estimated total */}
        <div className="flex items-center justify-between">
          <StatusBadge status={trip.status} />
          {trip.estimated_total && trip.estimated_total > 0 && (
            <span className="text-sm font-medium">
              ~${trip.estimated_total.toLocaleString()}
            </span>
          )}
        </div>
      </Link>

      {/* Quick Actions - positioned at bottom right */}
      <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Primary action button */}
        <Button
          variant="default"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={(e) => {
            e.preventDefault()
            router.push(primaryAction.href)
          }}
        >
          <primaryAction.icon className="w-3.5 h-3.5" />
          {primaryAction.label}
        </Button>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onShare(trip)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/trip/${trip.id}`)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(trip.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ filter }: { filter: FilterType }) {
  const messages: Record<FilterType, { title: string; description: string }> = {
    all: {
      title: 'no trips yet',
      description: 'start planning your next adventure — find an event you want to attend',
    },
    planning: {
      title: 'no trips in planning',
      description: 'trips you\'re still working on will appear here',
    },
    ready: {
      title: 'no trips ready to book',
      description: 'complete your trip details to get them ready for booking',
    },
    booked: {
      title: 'no booked trips',
      description: 'trips you\'ve booked will appear here',
    },
    past: {
      title: 'no past trips',
      description: 'your completed trips will appear here',
    },
  }

  const { title, description } = messages[filter]

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
        <Plane className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium mb-2 lowercase">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {filter === 'all' && (
        <Button asChild className="lowercase">
          <Link href="/search">
            <Plus className="w-4 h-4 mr-2" />
            plan your first trip
          </Link>
        </Button>
      )}
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
          className="rounded-2xl border bg-card p-5 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex justify-between mb-3">
            <div className="h-5 w-2/3 bg-muted rounded" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
          <div className="flex gap-4 mb-4">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-5 w-16 bg-muted rounded-full" />
            <div className="h-4 w-16 bg-muted rounded" />
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
// Share Modal (inline simple version)
// =============================================================================

function ShareDialog({
  trip,
  open,
  onOpenChange
}: {
  trip: Trip | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setShareUrl(null)
      setCopied(false)
    }
  }, [open])

  const handleGenerateLink = async () => {
    if (!trip) return

    setIsGenerating(true)
    try {
      const api = getApi()
      const result = await api.shareTrip(trip.id)
      const url = `${window.location.origin}/shared/${result.share_token}`
      setShareUrl(url)
    } catch (error) {
      console.error('Failed to generate share link:', error)
      toast.error('failed to create share link')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('failed to copy')
    }
  }

  if (!trip) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="lowercase">share trip</AlertDialogTitle>
          <AlertDialogDescription>
            create a link to share "{trip.event_name || trip.title}" with friends.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          {shareUrl ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border bg-muted font-mono truncate"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                anyone with this link can view and duplicate your trip.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  creating link...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  create share link
                </>
              )}
            </Button>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="lowercase">close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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

  // Share state
  const [shareTrip, setShareTrip] = useState<Trip | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

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

  // Handle share
  function handleShareClick(trip: Trip) {
    setShareTrip(trip)
    setShowShareDialog(true)
  }

  // Filter and count trips
  const { filteredTrips, counts } = useMemo(() => {
    const sorted = sortByEventDate(trips)

    const counts: Record<FilterType, number> = {
      all: trips.length,
      planning: 0,
      ready: 0,
      booked: 0,
      past: 0,
    }

    // Count trips per filter
    sorted.forEach(trip => {
      const filter = getFilterForTrip(trip)
      counts[filter]++
    })

    // Filter trips
    const filtered = activeFilter === 'all'
      ? sorted
      : sorted.filter(trip => getFilterForTrip(trip) === activeFilter)

    return { filteredTrips: filtered, counts }
  }, [trips, activeFilter])

  // Show verification prompt if not verified
  if (!authLoading && !isEmailVerified) {
    return (
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold lowercase">my trips</h1>
            <p className="text-muted-foreground mt-1">
              manage your travel plans
            </p>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm">
            <EmailVerificationPrompt
              title="verify your email to view trips"
              description="once verified, you can save and manage your travel plans"
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              in the meantime, you can still explore
            </p>
            <Button asChild variant="outline" className="lowercase">
              <Link href="/search">
                <Plus className="w-4 h-4 mr-2" />
                find an event
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold lowercase">my trips</h1>
            <p className="text-muted-foreground mt-1">
              manage your travel plans
            </p>
          </div>
          <Button asChild className="lowercase shrink-0">
            <Link href="/search">
              <Plus className="w-4 h-4 mr-2" />
              new trip
            </Link>
          </Button>
        </div>

        {/* Filter Tabs */}
        {!isLoading && !error && trips.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  'px-3.5 py-2 text-sm rounded-full transition-all whitespace-nowrap',
                  activeFilter === filter.value
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {filter.label}
                {counts[filter.value] > 0 && (
                  <span className={cn(
                    'ml-1.5',
                    activeFilter === filter.value ? 'opacity-80' : 'opacity-60'
                  )}>
                    {counts[filter.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {(isLoading || authLoading) ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={fetchTrips} />
        ) : trips.length === 0 ? (
          <EmptyState filter="all" />
        ) : filteredTrips.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={handleDeleteClick}
                onShare={handleShareClick}
                isDeleting={isDeleting && deleteId === trip.id}
              />
            ))}
          </div>
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
            <AlertDialogCancel disabled={isDeleting} className="lowercase">
              cancel
            </AlertDialogCancel>
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

      {/* Share Dialog */}
      <ShareDialog
        trip={shareTrip}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </div>
  )
}
