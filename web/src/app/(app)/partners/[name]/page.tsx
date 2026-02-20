import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrgPartnerRollup } from '@/lib/db/partners'
import { getPartnerActivity } from '@/lib/db/activity-log'
import { listRecapsForPartnerIds, listCombinedRecapsByPartnerName } from '@/lib/db/recaps'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PartnerDetail } from './partner-detail'

interface PartnerDetailPageProps {
  params: Promise<{ name: string }>
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) notFound()

  const allPartners = await getOrgPartnerRollup(membership.org_id)
  const partner = allPartners.find(
    (p) => p.name.toLowerCase().trim() === decodedName.toLowerCase().trim()
  )

  if (!partner) notFound()

  // Collect all partner IDs and event IDs for this group
  const partnerIds = partner.per_event_stats.map((s) => s.partner_id)
  const eventIds = partner.events.map((e) => e.id)

  const [activities, recaps, combinedRecaps] = await Promise.all([
    getPartnerActivity(membership.org_id, partnerIds, eventIds),
    listRecapsForPartnerIds(partnerIds),
    listCombinedRecapsByPartnerName(membership.org_id, decodedName),
  ])

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Partners', href: '/partners' },
          { label: partner.name },
        ]}
        className="mb-6"
      />

      <PartnerDetail partner={partner} activities={activities} recaps={recaps} combinedRecaps={combinedRecaps} />
    </div>
  )
}
