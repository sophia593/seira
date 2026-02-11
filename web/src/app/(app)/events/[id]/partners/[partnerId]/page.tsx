import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { getPartnerById } from '@/lib/db/partners'
import { listDeliverablesByPartner } from '@/lib/db/deliverables'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PartnerActions } from './partner-actions'
import { DeliverableSection } from './deliverable-section'
import { STATUS_FLOW, STATUS_CONFIG } from '@/lib/constants'
import type { DeliverableStatus } from '@/lib/types/database'

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

  // Compute status counts for chips
  const statusCounts = new Map<DeliverableStatus, number>()
  for (const d of deliverables) {
    statusCounts.set(d.status, (statusCounts.get(d.status) ?? 0) + 1)
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${eventId}` },
          { label: partner.name },
        ]}
        className="mb-6"
      />

      <div className="flex items-start justify-between gap-4 mb-6">
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
            <div className="mt-3">
              <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-1">Contract</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {partner.contract_notes}
              </p>
            </div>
          )}

          {deliverables.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {STATUS_FLOW.map((status) => {
                const count = statusCounts.get(status)
                if (!count) return null
                return (
                  <span
                    key={status}
                    className="border border-gray-200 rounded-full px-2.5 py-0.5 text-xs text-gray-600"
                  >
                    {count} {STATUS_CONFIG[status].label.toLowerCase()}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <PartnerActions partner={partner} eventId={eventId} deliverableCount={deliverables.length} />
      </div>

      <DeliverableSection
        deliverables={deliverables}
        eventId={eventId}
        partnerId={partnerId}
      />
    </div>
  )
}
