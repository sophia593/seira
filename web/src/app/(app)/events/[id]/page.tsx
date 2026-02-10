import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { EventHeader, EventActions } from '@/components/event-detail'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = await params

  const event = await getEventById(eventId)
  if (!event) {
    notFound()
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-5xl mx-auto">
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

      <p className="text-muted-foreground mt-8">Partners will appear here (Step 3)</p>
    </div>
  )
}
