import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { getPartnerById } from '@/lib/db/partners'
import { getDeliverableById } from '@/lib/db/deliverables'
import { listProofByDeliverable } from '@/lib/db/proof'
import { getDeliverableActivity } from '@/lib/db/activity-log'
import { getTalentById, listTalent } from '@/lib/db/talent'
import { getAssetById, listAssets } from '@/lib/db/assets'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { DeliverableDetailContent } from './deliverable-detail-content'
import type { ActivityLog } from '@/lib/types/database'

export interface StatusTransition {
  status: string
  timestamp: string
  actor: string | null
}

interface DeliverableDetailPageProps {
  params: Promise<{ id: string; partnerId: string; deliverableId: string }>
}

export default async function DeliverableDetailPage({ params }: DeliverableDetailPageProps) {
  const { id: eventId, partnerId, deliverableId } = await params

  const [deliverable, partner, event] = await Promise.all([
    getDeliverableById(deliverableId),
    getPartnerById(partnerId),
    getEventById(eventId),
  ])

  if (!deliverable || !partner || !event) notFound()
  if (deliverable.event_id !== eventId || deliverable.partner_id !== partnerId) notFound()

  // Fetch proofs, talent, and activity
  const [proofs, talent, talents, asset, assets] = await Promise.all([
    listProofByDeliverable(deliverableId),
    deliverable.talent_id ? getTalentById(deliverable.talent_id) : Promise.resolve(null),
    listTalent(event.org_id),
    deliverable.asset_id ? getAssetById(deliverable.asset_id) : Promise.resolve(null),
    listAssets(event.org_id),
  ])
  const proofIds = proofs.map((p) => p.id)
  const activities = await getDeliverableActivity(deliverableId, proofIds)

  // Resolve owner name
  let ownerName: string | null = null
  if (deliverable.owner_id) {
    try {
      const admin = tryCreateAdminClient()
      if (admin) {
        const { data } = await admin.auth.admin.getUserById(deliverable.owner_id)
        if (data?.user) {
          ownerName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            null
        }
      }
    } catch {
      // Owner resolution failed — leave null
    }
  }

  // Build status history from activity log
  const statusHistory: StatusTransition[] = [
    { status: 'not_started', timestamp: deliverable.created_at, actor: null },
  ]

  const statusChanges = activities
    .filter((a: ActivityLog) => a.action === 'status_changed' && a.target_type === 'deliverable')
    .reverse() // chronological order

  for (const a of statusChanges) {
    const details = a.details_json as Record<string, unknown>
    const to = details?.to as string | undefined
    const actor = (details?.actor_email as string)?.split('@')[0] ?? null
    if (to) {
      statusHistory.push({ status: to, timestamp: a.created_at, actor })
    }
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${eventId}` },
          { label: partner.name, href: `/events/${eventId}/partners/${partnerId}` },
          { label: deliverable.title },
        ]}
        className="mb-6"
      />
      <DeliverableDetailContent
        deliverable={deliverable}
        partner={partner}
        eventId={eventId}
        proofs={proofs}
        activities={activities}
        statusHistory={statusHistory}
        ownerName={ownerName}
        talent={talent}
        talents={talents}
        asset={asset}
        assets={assets}
        eventDate={event.date}
      />
    </div>
  )
}
