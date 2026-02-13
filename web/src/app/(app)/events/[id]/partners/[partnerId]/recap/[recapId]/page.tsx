import { notFound } from 'next/navigation'
import { getRecapById, getRecapData } from '@/lib/db/recaps'
import { getEventById } from '@/lib/db/events'
import { getPartnerById } from '@/lib/db/partners'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { RecapContent } from '@/components/recap/recap-content'
import { RecapControls } from './recap-controls'

interface RecapPreviewPageProps {
  params: Promise<{ id: string; partnerId: string; recapId: string }>
}

export default async function RecapPreviewPage({ params }: RecapPreviewPageProps) {
  const { id: eventId, partnerId, recapId } = await params

  const [recap, event, partner] = await Promise.all([
    getRecapById(recapId),
    getEventById(eventId),
    getPartnerById(partnerId),
  ])

  if (!recap || !event || !partner) notFound()
  if (recap.partner_id !== partnerId || recap.event_id !== eventId) notFound()

  const data = await getRecapData(recapId)
  if (!data) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const shareUrl = recap.status === 'published'
    ? `${baseUrl}/recap/${recap.share_token}`
    : null

  return (
    <div>
      <div className="px-4 py-4 md:px-8 border-b border-gray-200 bg-white sticky top-0 z-10">
        <Breadcrumbs
          items={[
            { label: 'Events', href: '/events' },
            { label: event.name, href: `/events/${eventId}` },
            { label: partner.name, href: `/events/${eventId}/partners/${partnerId}` },
            { label: 'Recap' },
          ]}
          className="mb-3"
        />
        <RecapControls
          recap={recap}
          eventId={eventId}
          partnerId={partnerId}
          shareUrl={shareUrl}
          partnerContactEmail={partner.contact_email}
          partnerName={partner.name}
          eventName={event.name}
        />
      </div>

      <RecapContent data={data} />
    </div>
  )
}
