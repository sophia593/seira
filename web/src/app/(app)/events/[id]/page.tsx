import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { listPartnersByEvent } from '@/lib/db/partners'
import { listDeliverablesByEvent } from '@/lib/db/deliverables'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { EventHeader, EventActions } from '@/components/event-detail'
import { PartnerSection } from './partner-section'
import { completionPct } from '@/lib/constants'

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

  // Compute per-partner completion stats
  const completionMap = new Map<string, { total: number; completed: number; pct: number }>()
  for (const d of deliverables) {
    const entry = completionMap.get(d.partner_id) ?? { total: 0, completed: 0, pct: 0 }
    entry.total++
    if (d.status === 'done' || d.status === 'proved') entry.completed++
    completionMap.set(d.partner_id, entry)
  }
  for (const [key, entry] of completionMap) {
    completionMap.set(key, { ...entry, pct: completionPct(entry.total, entry.completed) })
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

      <PartnerSection partners={partners} eventId={eventId} completionMap={completionMap} />
    </div>
  )
}
