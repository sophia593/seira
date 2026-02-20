'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarDays, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrg } from '@/hooks/use-org'
import { CreateEventDialog } from '@/app/(app)/events/create-event-dialog'
import { deleteEventAction } from '@/app/(app)/actions/events'
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
import { ProgressBar } from '@/components/ui/progress-bar'
import { toast } from '@/components/ui/sonner'
import { SortControl } from '@/components/ui/sort-control'
import { formatEventDate, formatShortDate, EVENT_DOT_COLOR } from '@/lib/constants'
import type { EventStatus, EventWithCompletion } from '@/lib/types/database'

// =============================================================================
// Types
// =============================================================================

type EventListItem = EventWithCompletion & { partner_count: number }

export interface SeasonOption {
  id: string
  name: string
}

interface EventListProps {
  events: EventListItem[]
  orgId: string
  seasons?: SeasonOption[]
}

// =============================================================================
// Component
// =============================================================================

type EventSort = 'date' | 'name' | 'completion'
const EVENT_SORT_OPTIONS = [
  { value: 'date' as const, label: 'Date' },
  { value: 'name' as const, label: 'Name' },
  { value: 'completion' as const, label: 'Completion' },
]

export function EventList({ events, seasons = [] }: EventListProps) {
  const router = useRouter()
  const { isAdmin } = useOrg()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EventListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sort, setSort] = useState<EventSort>('date')
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpenId) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpenId])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const result = await deleteEventAction(deleteTarget.id)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete event')
        setIsDeleting(false)
        return
      }
      toast.success('Event deleted')
      setDeleteTarget(null)
      router.refresh()
    } catch {
      toast.error('Failed to delete event')
      setIsDeleting(false)
    }
  }

  const sortedEvents = useMemo(() => {
    const list = [...events]
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'completion') return a.completion_pct - b.completion_pct
      // date: soonest first, nulls last
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.localeCompare(b.date)
    })
    return list
  }, [events, sort])

  // Find the soonest upcoming/active event for the "Next Up" strip
  const nextUpEvent = events.find(e => e.status === 'upcoming' || e.status === 'active')

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Events
          {events.length > 0 && (
            <span className="text-gray-300 font-normal text-lg ml-2">{events.length}</span>
          )}
        </h1>
        {isAdmin && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="bg-kurobeni text-white text-sm rounded-md h-9 px-4 hover:bg-blackberry transition-colors"
          >
            + New event
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Manage games, concerts, and sponsor fulfillment in one place.
      </p>

      {/* ---------- Empty state ---------- */}
      {events.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No events yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create your first event to start tracking partner deliverables.
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="bg-kurobeni text-white text-sm rounded-md h-9 px-4 hover:bg-blackberry transition-colors"
            >
              + new event
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ---------- Next Up strip ---------- */}
          {nextUpEvent && (
            <div className="border border-gray-200 rounded-lg px-5 py-4 mb-6">
              <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-copper font-medium">Next Up</p>
                  <p className="text-base font-semibold mt-1 truncate">{nextUpEvent.name}</p>
                  {(nextUpEvent.venue || nextUpEvent.date) && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {[nextUpEvent.venue, nextUpEvent.date ? formatEventDate(nextUpEvent.date) : null].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {nextUpEvent.total_deliverables > 0 && (
                    <div className="hidden sm:flex items-center gap-3">
                      <ProgressBar value={nextUpEvent.completion_pct} className="w-32" size="sm" />
                      {nextUpEvent.overdue_count > 0 && (
                        <span className="text-xs text-red-500 whitespace-nowrap">{nextUpEvent.overdue_count} overdue</span>
                      )}
                      {(nextUpEvent.needs_proof_count ?? 0) > 0 && (
                        <span className="text-xs text-amber-400 flex items-center gap-1 whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3" />
                          {nextUpEvent.needs_proof_count} need proof
                        </span>
                      )}
                    </div>
                  )}
                  <Link
                    href={`/events/${nextUpEvent.id}`}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
                  >
                    View event &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ---------- All events section ---------- */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              All events
              <span className="text-gray-300 font-normal ml-2">{events.length}</span>
            </h2>
            <SortControl options={EVENT_SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>

          <div className="divide-y divide-gray-100">
            {sortedEvents.map((event) => (
              <div key={event.id} className="group relative">
                <Link
                  href={`/events/${event.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Status dot + name + venue/date */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full shrink-0', EVENT_DOT_COLOR[event.status])} />
                      <span className="text-sm font-medium text-gray-900 truncate">{event.name}</span>
                    </div>
                    {(event.venue || event.date) && (
                      <p className="text-xs text-gray-400 mt-0.5 pl-4">
                        {[event.venue, event.date ? formatShortDate(event.date) : null].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* Meta: partners · deliverables */}
                  <span className="hidden sm:block text-xs text-gray-300 whitespace-nowrap shrink-0">
                    {event.partner_count} partner{event.partner_count !== 1 ? 's' : ''} · {event.total_deliverables} deliverable{event.total_deliverables !== 1 ? 's' : ''}
                  </span>

                  {/* Progress bar + overdue + proof */}
                  {event.total_deliverables > 0 ? (
                    <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5">
                      <ProgressBar value={event.completion_pct} size="sm" className="w-24" />
                      {event.overdue_count > 0 && (
                        <span className="text-xs text-red-400">{event.overdue_count} overdue</span>
                      )}
                      {(event.needs_proof_count ?? 0) > 0 && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {event.needs_proof_count} need proof
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Keep alignment when no deliverables */
                    <div className="hidden sm:block w-[8.5rem] shrink-0" />
                  )}

                  {/* Spacer for three-dot menu */}
                  <div className="w-7 shrink-0" />
                </Link>

                {/* Three-dot menu — visible on hover */}
                <div
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  ref={menuOpenId === event.id ? menuRef : undefined}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setMenuOpenId(menuOpenId === event.id ? null : event.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>

                  {menuOpenId === event.id && (
                    <div className="absolute right-0 top-full mt-1 z-[80] w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <Link
                        href={`/events/${event.id}`}
                        className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setMenuOpenId(null)}
                      >
                        Edit
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMenuOpenId(null)
                            setDeleteTarget(event)
                          }}
                          className="flex w-full items-center px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CreateEventDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} seasons={seasons} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setIsDeleting(false) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will delete all partners and deliverables for &quot;{deleteTarget?.name}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
