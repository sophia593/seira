import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getEventById } from '@/lib/db/events'
import { getPartnerById } from '@/lib/db/partners'
import { listDeliverables } from '@/lib/db/deliverables'
import {
  PartnerHeader,
  PartnerActions,
  DeliverableList,
} from '@/components/partner-detail'

interface PartnerDetailPageProps {
  params: Promise<{ id: string; partnerId: string }>
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const { id: eventId, partnerId } = await params
  const supabase = await createClient()

  // Get user and org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase as Parameters<typeof getUserMembership>[0], user.id)
  if (!membership) redirect('/login')

  const orgId = membership.org_id

  // Fetch event and partner in parallel
  const [event, partner] = await Promise.all([
    getEventById(
      supabase as Parameters<typeof getEventById>[0],
      eventId,
      orgId
    ),
    getPartnerById(
      supabase as Parameters<typeof getPartnerById>[0],
      partnerId,
      orgId
    ),
  ])

  if (!event || !partner) {
    notFound()
  }

  // Verify partner belongs to this event
  if (partner.event_id !== eventId) {
    notFound()
  }

  // Fetch deliverables
  const deliverables = await listDeliverables(
    supabase as Parameters<typeof listDeliverables>[0],
    { partnerId }
  )

  return (
    <div className="px-6 py-8 md:px-10 md:py-12 max-w-4xl">
      {/* Header with actions */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          <PartnerHeader partner={partner} event={event} />
        </div>
        <PartnerActions partner={partner} eventId={eventId} orgId={orgId} />
      </div>

      {/* Deliverables section */}
      <DeliverableList
        deliverables={deliverables}
        partnerId={partnerId}
        eventId={eventId}
      />
    </div>
  )
}
