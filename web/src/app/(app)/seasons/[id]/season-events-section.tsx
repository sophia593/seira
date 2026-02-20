'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays, AlertTriangle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatShortDate, EVENT_DOT_COLOR } from '@/lib/constants'
import { useOrg } from '@/hooks/use-org'
import { SortControl } from '@/components/ui/sort-control'
import { BatchCreateDialog } from './batch-create-dialog'
import type { EventStatus, EventWithCompletion, DeliverableCategory, ProofRequired } from '@/lib/types/database'

type EventListItem = EventWithCompletion & { partner_count: number }

interface TemplateOption {
  id: string
  name: string
  deliverableCount: number
  isGlobal: boolean
  deliverables: { title: string; category: DeliverableCategory; proof_required: ProofRequired; notes?: string }[]
}

interface SeasonEventsSectionProps {
  events: EventListItem[]
  templates?: TemplateOption[]
}

type EventSort = 'date' | 'name' | 'completion'
const EVENT_SORT_OPTIONS = [
  { value: 'date' as const, label: 'Date' },
  { value: 'name' as const, label: 'Name' },
  { value: 'completion' as const, label: 'Completion' },
]

export function SeasonEventsSection({ events, templates = [] }: SeasonEventsSectionProps) {
  const { canEdit } = useOrg()
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [sort, setSort] = useState<EventSort>('date')

  const sortedEvents = useMemo(() => {
    const list = [...events]
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'completion') return a.completion_pct - b.completion_pct
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.localeCompare(b.date)
    })
    return list
  }, [events, sort])

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">No events in this season</p>
        <p className="text-xs text-muted-foreground mt-1">
          Assign events to this season from the event create or edit form.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">
            Events
            <span className="text-gray-300 font-normal ml-2">{events.length}</span>
          </h2>
          <SortControl options={EVENT_SORT_OPTIONS} value={sort} onChange={setSort} />
        </div>
        {canEdit && events.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowBatchDialog(true)} className="gap-1">
            <Layers className="w-3.5 h-3.5" />
            Batch Create
          </Button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {sortedEvents.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            {/* Status dot + name + venue/date */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full shrink-0', EVENT_DOT_COLOR[event.status as EventStatus])} />
                <span className="text-sm font-medium text-gray-900 truncate">{event.name}</span>
              </div>
              {(event.venue || event.date) && (
                <p className="text-xs text-gray-400 mt-0.5 pl-4">
                  {[event.venue, event.date ? formatShortDate(event.date) : null].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Meta */}
            <span className="hidden sm:block text-xs text-gray-300 whitespace-nowrap shrink-0">
              {event.partner_count} partner{event.partner_count !== 1 ? 's' : ''} · {event.total_deliverables} deliverable{event.total_deliverables !== 1 ? 's' : ''}
            </span>

            {/* Progress */}
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
              <div className="hidden sm:block w-[8.5rem] shrink-0" />
            )}
          </Link>
        ))}
      </div>

      <BatchCreateDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        events={events.map((e) => ({ id: e.id, name: e.name, date: e.date }))}
        templates={templates}
      />
    </>
  )
}
