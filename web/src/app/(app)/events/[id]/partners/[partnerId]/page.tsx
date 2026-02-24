import { notFound } from 'next/navigation'
import { startTimer } from '@/lib/perf'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/lib/db/events'
import { getPartnerById } from '@/lib/db/partners'
import { listDeliverablesByPartner } from '@/lib/db/deliverables'
import { countProofByDeliverable, listProofByPartner } from '@/lib/db/proof'
import { listRecapsByPartner } from '@/lib/db/recaps'
import { listTemplates } from '@/lib/db/templates'
import { listTalent } from '@/lib/db/talent'
import { listAssets } from '@/lib/db/assets'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PartnerActions } from './partner-actions'
import { DeliverableSection } from './deliverable-section'
import { RecapSection } from './recap-section'
import { STATUS_FLOW, STATUS_CONFIG, RECAP_STATUS_CONFIG } from '@/lib/constants'
import { InfoTip } from '@/components/ui/info-tip'
import { RecapStatusBadge } from '@/components/ui/badges'
import type { DeliverableStatus } from '@/lib/types/database'

interface PartnerDetailPageProps {
  params: Promise<{ id: string; partnerId: string }>
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const pageTimer = startTimer('PartnerDetailPage:total')
  const { id: eventId, partnerId } = await params

  const [eventResult, partnerResult, deliverablesResult] = await Promise.allSettled([
    getEventById(eventId),
    getPartnerById(partnerId),
    listDeliverablesByPartner(partnerId),
  ])

  const event = eventResult.status === 'fulfilled' ? eventResult.value : null
  const partner = partnerResult.status === 'fulfilled' ? partnerResult.value : null
  const deliverables = deliverablesResult.status === 'fulfilled' ? deliverablesResult.value : []

  if (!event || !partner) notFound()
  if (partner.event_id !== eventId) notFound()

  // Fetch proof data + recaps + templates
  const supabase = await createClient()
  const deliverableIds = deliverables.map((d) => d.id)
  const [proofCountsResult, allProofsResult, recapsResult, templatesResult, talentsResult, assetsResult] = await Promise.allSettled([
    countProofByDeliverable(deliverableIds),
    listProofByPartner(partnerId),
    listRecapsByPartner(partnerId),
    listTemplates(supabase, event.org_id),
    listTalent(event.org_id),
    listAssets(event.org_id),
  ])

  const proofCounts = proofCountsResult.status === 'fulfilled' ? proofCountsResult.value : {}
  const allProofs = allProofsResult.status === 'fulfilled' ? allProofsResult.value : []
  const recaps = recapsResult.status === 'fulfilled' ? recapsResult.value : []
  const templates = templatesResult.status === 'fulfilled' ? templatesResult.value : []
  const talents = talentsResult.status === 'fulfilled' ? talentsResult.value : []
  const assets = assetsResult.status === 'fulfilled' ? assetsResult.value : []

  // Build proof map: deliverable_id → Proof[]
  const proofMap: Record<string, typeof allProofs> = {}
  for (const p of allProofs) {
    const dId = p.deliverable_id
    if (!proofMap[dId]) proofMap[dId] = []
    proofMap[dId].push(p)
  }

  // Build talent map: talent_id → { id, name, photo_url, type }
  const talentMap: Record<string, { id: string; name: string; photo_url: string | null; type: string }> = {}
  for (const t of talents) {
    talentMap[t.id] = { id: t.id, name: t.name, photo_url: t.photo_url, type: t.type }
  }

  // Build asset map: asset_id → { id, name, capacity }
  const assetMap: Record<string, { id: string; name: string; capacity: number | null }> = {}
  for (const a of assets) {
    assetMap[a.id] = { id: a.id, name: a.name, capacity: a.capacity }
  }

  // Compute status counts for chips
  const statusCounts = new Map<DeliverableStatus, number>()
  for (const d of deliverables) {
    statusCounts.set(d.status, (statusCounts.get(d.status) ?? 0) + 1)
  }

  // Proof summary counts
  const provedCount = statusCounts.get('proved') ?? 0
  const doneCount = statusCounts.get('done') ?? 0
  const needProofCount = deliverables.filter(
    (d) => d.status === 'done' && (proofCounts[d.id] ?? 0) === 0
  ).length

  // Latest recap status for chip
  const latestRecap = recaps[0] ?? null
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const recapPublicUrl = latestRecap?.status === 'published'
    ? `${baseUrl}/recap/${latestRecap.share_token}`
    : null

  pageTimer.end()
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
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CONFIG[status].bgColor} ${STATUS_CONFIG[status].color} ${STATUS_CONFIG[status].borderColor}`}
                  >
                    {count} {STATUS_CONFIG[status].label.toLowerCase()}
                  </span>
                )
              })}
              {provedCount > 0 && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CONFIG.proved.bgColor} ${STATUS_CONFIG.proved.color} ${STATUS_CONFIG.proved.borderColor}`}>
                  {provedCount} of {deliverables.length} proved
                </span>
              )}
              {needProofCount > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                  {needProofCount} need proof
                </span>
              )}
              {latestRecap?.status === 'published' && recapPublicUrl && (
                <a
                  href={recapPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium hover:opacity-80 transition-colors ${RECAP_STATUS_CONFIG.published.bgColor} ${RECAP_STATUS_CONFIG.published.color} ${RECAP_STATUS_CONFIG.published.borderColor}`}
                >
                  Recap published
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </a>
              )}
              {latestRecap?.status === 'draft' && (
                <RecapStatusBadge status="draft" />
              )}
            </div>
          )}

          {deliverables.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5 inline-flex items-center gap-1">
                Proof collection
                <InfoTip text="Tracks how many deliverables have verified proof for recap reports" />
              </p>
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
        templates={templates}
        talentMap={talentMap}
        talents={talents}
        assets={assets}
        assetMap={assetMap}
        eventDate={event.date}
      />

      <RecapSection
        recaps={recaps}
        eventId={eventId}
        partnerId={partnerId}
      />
    </div>
  )
}
