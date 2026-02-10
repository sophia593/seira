import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { getPartnerById } from '@/lib/db/partners'
import { listDeliverablesByPartner } from '@/lib/db/deliverables'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PartnerActions } from './partner-actions'
import { DeliverableSection } from './deliverable-section'

interface PartnerDetailPageProps {
  params: Promise<{ id: string; partnerId: string }>
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const { id: eventId, partnerId } = await params

  const [event, partner, deliverables] = await Promise.all([
    getEventById(eventId),
    getPartnerById(partnerId),
    listDeliverablesByPartner(partnerId),
  ])

  if (!event || !partner) notFound()
  if (partner.event_id !== eventId) notFound()

  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${eventId}` },
          { label: partner.name },
        ]}
        className="mb-6"
      />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">{partner.name}</h1>

          {(partner.contact_name || partner.contact_email) && (
            <p className="text-muted-foreground">
              {partner.contact_name}
              {partner.contact_name && partner.contact_email && ' · '}
              {partner.contact_email && (
                <a
                  href={`mailto:${partner.contact_email}`}
                  className="hover:text-foreground transition-colors underline underline-offset-2"
                >
                  {partner.contact_email}
                </a>
              )}
            </p>
          )}

          {partner.contract_notes && (
            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
              {partner.contract_notes}
            </p>
          )}
        </div>

        <PartnerActions partner={partner} eventId={eventId} />
      </div>

      <DeliverableSection
        deliverables={deliverables}
        eventId={eventId}
        partnerId={partnerId}
      />
    </div>
  )
}
