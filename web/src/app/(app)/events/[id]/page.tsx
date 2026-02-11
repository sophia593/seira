import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { listPartnersByEvent } from '@/lib/db/partners'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { EventHeader, EventActions } from '@/components/event-detail'
import { PartnerSection } from './partner-section'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = await params

  const event = await getEventById(eventId)
  if (!event) {
    notFound()
  }

  const partners = await listPartnersByEvent(eventId)

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

      <PartnerSection partners={partners} eventId={eventId} />
    </div>
  )
}
