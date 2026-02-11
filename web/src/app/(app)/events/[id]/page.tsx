import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { listPartnersByEvent } from '@/lib/db/partners'
import { listDeliverablesByEvent } from '@/lib/db/deliverables'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { EventHeader, EventActions } from '@/components/event-detail'
import { PartnerSection } from './partner-section'
import { completionPct, isOverdue } from '@/lib/constants'
import type { DeliverableStatus } from '@/lib/types/database'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = await params

  const event = await getEventById(eventId)
  if (!event) {
    notFound()
  }

  const [partners, deliverables] = await Promise.all([
    listPartnersByEvent(eventId),
    listDeliverablesByEvent(eventId),
  ])

  // Compute per-partner stats (plain object — serializable across server→client)
  const completionMap: Record<string, {
    total: number; completed: number; pct: number; overdue: number
    not_started: number; in_progress: number; done: number; proved: number
  }> = {}
  for (const d of deliverables) {
    const entry = completionMap[d.partner_id] ?? {
      total: 0, completed: 0, pct: 0, overdue: 0,
      not_started: 0, in_progress: 0, done: 0, proved: 0,
    }
    entry.total++
    if (d.status === 'done' || d.status === 'proved') entry.completed++
    if (isOverdue(d.status, d.due_date)) entry.overdue++
    entry[d.status]++
    completionMap[d.partner_id] = entry
  }
  for (const key of Object.keys(completionMap)) {
    const entry = completionMap[key]
    completionMap[key] = { ...entry, pct: completionPct(entry.total, entry.completed) }
  }

  // First 3 deliverables per partner for inline preview
  const deliverablePreviewMap: Record<string, { id: string; title: string; status: DeliverableStatus; due_date: string | null }[]> = {}
  for (const d of deliverables) {
    const arr = deliverablePreviewMap[d.partner_id] ?? []
    if (arr.length < 3) arr.push({ id: d.id, title: d.title, status: d.status, due_date: d.due_date })
    deliverablePreviewMap[d.partner_id] = arr
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name },
        ]}
        className="mb-6"
      />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          <EventHeader event={event} />
        </div>
        <EventActions event={event} />
      </div>

      <PartnerSection
        partners={partners}
        eventId={eventId}
        completionMap={completionMap}
        deliverablePreviewMap={deliverablePreviewMap}
      />
    </div>
  )
}
