import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrgPartnerRollup } from '@/lib/db/partners'
import { PartnerDirectory } from './partner-directory'
import { EmptyState } from '@/components/ui/empty-state'
import { Building2 } from 'lucide-react'
import { startTimer } from '@/lib/perf'

export default async function PartnersPage() {
  const pageTimer = startTimer('PartnersPage:total')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)

  if (!membership) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
        <EmptyState
          icon={Building2}
          title="Workspace setup incomplete"
          description="Your workspace couldn't be created automatically. Please check server logs or contact support."
        />
      </div>
    )
  }

  let partners: Awaited<ReturnType<typeof getOrgPartnerRollup>> = []

  try {
    partners = await getOrgPartnerRollup(membership.org_id)
  } catch (e) {
    console.error('[Partners] Failed to load partners:', e)
  }

  pageTimer.end()
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <PartnerDirectory partners={partners} />
    </div>
  )
}
