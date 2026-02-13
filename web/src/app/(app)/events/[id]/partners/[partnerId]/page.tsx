import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { getPartnerById } from '@/lib/db/partners'
import { listDeliverablesByPartner } from '@/lib/db/deliverables'
import { countProofByDeliverable, listProofByPartner } from '@/lib/db/proof'
import { listRecapsByPartner } from '@/lib/db/recaps'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PartnerActions } from './partner-actions'
import { DeliverableSection } from './deliverable-section'
import { RecapSection } from './recap-section'
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

  // Fetch proof data + recaps
  const deliverableIds = deliverables.map((d) => d.id)
  const [proofCounts, allProofs, recaps] = await Promise.all([
    countProofByDeliverable(deliverableIds),
    listProofByPartner(partnerId),
    listRecapsByPartner(partnerId),
  ])

  // Build proof map: deliverable_id → Proof[]
  const proofMap: Record<string, typeof allProofs> = {}
  for (const p of allProofs) {
    const dId = p.deliverable_id
    if (!proofMap[dId]) proofMap[dId] = []
    proofMap[dId].push(p)
  }

  // Compute status counts for chips
  const statusCounts = new Map<DeliverableStatus, number>()
  for (const d of deliverables) {
    statusCounts.set(d.status, (statusCounts.get(d.status) ?? 0) + 1)
  }

  // Proof summary counts
  const provedCount = statusCounts.get('proved') ?? 0
  const doneCount = statusCounts.get('done') ?? 0
  const needProofCount = doneCount // done but not yet proved

  // Latest recap status for chip
  const latestRecap = recaps[0] ?? null
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const recapPublicUrl = latestRecap?.status === 'published'
    ? `${baseUrl}/recap/${latestRecap.share_token}`
    : null

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
              {provedCount > 0 && (
                <span className="border border-copper/30 bg-copper/5 rounded-full px-2.5 py-0.5 text-xs text-copper">
                  {provedCount} of {deliverables.length} proved
                </span>
              )}
              {needProofCount > 0 && (
                <span className="border border-amber-200 bg-amber-50 rounded-full px-2.5 py-0.5 text-xs text-amber-600">
                  {needProofCount} need proof
                </span>
              )}
              {latestRecap?.status === 'published' && recapPublicUrl && (
                <a
                  href={recapPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-green-200 bg-green-50 rounded-full px-2.5 py-0.5 text-xs text-green-700 hover:bg-green-100 transition-colors"
                >
                  Recap published
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </a>
              )}
              {latestRecap?.status === 'draft' && (
                <span className="border border-amber-200 bg-amber-50 rounded-full px-2.5 py-0.5 text-xs text-amber-600">
                  Recap draft
                </span>
              )}
            </div>
          )}

          {deliverables.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Proof collection</p>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-copper rounded-full transition-all duration-300"
                  style={{ width: `${deliverables.length > 0 ? Math.round((provedCount / deliverables.length) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {provedCount === deliverables.length ? (
                  <span className="text-green-600 font-medium">All proof collected</span>
                ) : provedCount > 0 ? (
                  `${provedCount} of ${deliverables.length} deliverables have proof`
                ) : (
                  <span className="text-gray-300">No proof uploaded yet</span>
                )}
              </p>
            </div>
          )}
        </div>

        <PartnerActions partner={partner} eventId={eventId} deliverableCount={deliverables.length} />
      </div>

      <DeliverableSection
        deliverables={deliverables}
        eventId={eventId}
        partnerId={partnerId}
        proofCounts={proofCounts}
        proofMap={proofMap}
      />

      <RecapSection
        recaps={recaps}
        eventId={eventId}
        partnerId={partnerId}
      />
    </div>
  )
}
