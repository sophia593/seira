'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
  Loader2,
  WifiOff,
  FileQuestion,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { getApi, type TripDetail, type Trip } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TripDetailComponent } from '@/components/trips/trip-detail'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

type ErrorType = 'not-found' | 'deleted' | 'network' | 'unknown'

interface TripNavigation {
  prev: Trip | null
  next: Trip | null
}

// =============================================================================
// Main Page
// =============================================================================

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorType, setErrorType] = useState<ErrorType | null>(null)

  // Edit title state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  // Navigation state
  const [navigation, setNavigation] = useState<TripNavigation>({ prev: null, next: null })

  // Fetch trip and navigation
  const fetchTrip = useCallback(async () => {
    setIsLoading(true)
    setErrorType(null)

    try {
      const api = getApi()

      // Fetch trip detail
      const data = await api.getTrip(tripId)
      setTrip(data)
      setEditedTitle(data.title || '')

      // Fetch all trips for navigation
      const allTrips = await api.getTrips()
      const currentIndex = allTrips.findIndex(t => t.id === tripId)

      setNavigation({
        prev: currentIndex > 0 ? allTrips[currentIndex - 1] : null,
        next: currentIndex < allTrips.length - 1 ? allTrips[currentIndex + 1] : null,
      })

    } catch (err: any) {
      // Determine error type
      if (err?.status === 404) {
        setErrorType('not-found')
      } else if (err?.message?.includes('deleted') || err?.status === 410) {
        setErrorType('deleted')
      } else if (!navigator.onLine || err?.message?.includes('network') || err?.message?.includes('fetch')) {
        setErrorType('network')
      } else {
        setErrorType('unknown')
      }
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  // Handle title edit
  async function handleSaveTitle() {
    if (!trip || editedTitle.trim() === trip.title) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)
    try {
      const api = getApi()
      await api.updateTrip(tripId, { title: editedTitle.trim() })
      setTrip({ ...trip, title: editedTitle.trim() })
      setIsEditingTitle(false)
      toast.success('title updated')
    } catch {
      toast.error('couldn\'t update title')
    } finally {
      setIsSavingTitle(false)
    }
  }

  function handleCancelEdit() {
    setEditedTitle(trip?.title || '')
    setIsEditingTitle(false)
  }

  // Handle keyboard shortcuts
  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (errorType) {
    return (
      <ErrorState
        type={errorType}
        onRetry={fetchTrip}
        tripId={tripId}
      />
    )
  }

  if (!trip) {
    return <ErrorState type="not-found" onRetry={fetchTrip} tripId={tripId} />
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Back link */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          back to trips
        </Link>

        {/* Editable Title */}
        <div className="mb-6">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="text-xl sm:text-2xl font-semibold h-auto py-1 px-2 lowercase"
                placeholder="trip title"
                autoFocus
                disabled={isSavingTitle}
              />
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle}
                className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                title="Save"
              >
                {isSavingTitle ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSavingTitle}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold lowercase">
                {trip.title || 'untitled trip'}
              </h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all"
                title="Edit title"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Trip Detail Component */}
        <TripDetailComponent trip={trip} />

        {/* Prev/Next Navigation */}
        {(navigation.prev || navigation.next) && (
          <div className="flex items-center justify-between mt-12 pt-8 border-t">
            {/* Previous Trip */}
            {navigation.prev ? (
              <Link
                href={`/trips/${navigation.prev.id}`}
                className="group flex items-center gap-3 max-w-[45%]"
              >
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">previous</div>
                  <div className="text-sm font-medium truncate lowercase group-hover:text-primary transition-colors">
                    {navigation.prev.title || 'untitled trip'}
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {/* Next Trip */}
            {navigation.next ? (
              <Link
                href={`/trips/${navigation.next.id}`}
                className="group flex items-center gap-3 max-w-[45%] text-right"
              >
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">next</div>
                  <div className="text-sm font-medium truncate lowercase group-hover:text-primary transition-colors">
                    {navigation.next.title || 'untitled trip'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="animate-pulse space-y-6">
          {/* Back link */}
          <div className="h-4 w-24 bg-muted rounded" />

          {/* Title */}
          <div className="h-8 w-2/3 bg-muted rounded" />

          {/* Header card */}
          <div className="h-24 bg-muted rounded-xl" />

          {/* Event card */}
          <div className="h-64 bg-muted rounded-2xl" />

          {/* Flight & Hotel */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Error State
// =============================================================================

interface ErrorStateProps {
  type: ErrorType
  onRetry: () => void
  tripId: string
}

const errorConfigs: Record<ErrorType, {
  icon: React.ElementType
  iconClassName: string
  title: string
  message: string
  suggestions: string[]
  showRetry: boolean
}> = {
  'not-found': {
    icon: FileQuestion,
    iconClassName: 'text-muted-foreground',
    title: 'trip not found',
    message: 'we couldn\'t find this trip. it may have never existed or the link might be incorrect.',
    suggestions: [
      'check if the URL is correct',
      'the trip may have been deleted',
      'try searching in your trips list',
    ],
    showRetry: false,
  },
  'deleted': {
    icon: Trash2,
    iconClassName: 'text-destructive',
    title: 'trip was deleted',
    message: 'this trip has been deleted and is no longer available.',
    suggestions: [
      'check your other trips',
      'start planning a new trip',
    ],
    showRetry: false,
  },
  'network': {
    icon: WifiOff,
    iconClassName: 'text-yellow-500',
    title: 'connection problem',
    message: 'we\'re having trouble connecting. this might be a temporary network issue.',
    suggestions: [
      'check your internet connection',
      'try refreshing the page',
      'wait a moment and try again',
    ],
    showRetry: true,
  },
  'unknown': {
    icon: FileQuestion,
    iconClassName: 'text-muted-foreground',
    title: 'something went wrong',
    message: 'we couldn\'t load this trip. this might be a temporary issue.',
    suggestions: [
      'try refreshing the page',
      'come back in a few minutes',
      'contact support if the problem persists',
    ],
    showRetry: true,
  },
}

function ErrorState({ type, onRetry, tripId }: ErrorStateProps) {
  const config = errorConfigs[type]
  const Icon = config.icon

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          back to trips
        </Link>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
            <Icon className={cn('w-8 h-8', config.iconClassName)} />
          </div>

          {/* Title & Message */}
          <h1 className="text-xl font-semibold mb-2 lowercase">{config.title}</h1>
          <p className="text-muted-foreground mb-6 max-w-md">{config.message}</p>

          {/* Suggestions */}
          <div className="bg-muted/30 rounded-xl p-4 mb-8 text-left max-w-sm w-full">
            <p className="text-xs text-muted-foreground mb-2 lowercase">suggestions:</p>
            <ul className="space-y-1.5">
              {config.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {config.showRetry && (
              <Button onClick={onRetry} className="lowercase gap-2">
                <RefreshCw className="w-4 h-4" />
                try again
              </Button>
            )}
            <Button asChild variant={config.showRetry ? 'outline' : 'default'} className="lowercase">
              <Link href="/trips">view all trips</Link>
            </Button>
            <Button asChild variant="outline" className="lowercase">
              <Link href="/chat">plan new trip</Link>
            </Button>
          </div>

          {/* Error reference */}
          <p className="text-xs text-muted-foreground mt-8">
            trip id: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{tripId}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
