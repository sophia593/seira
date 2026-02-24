import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listTalent } from '@/lib/db/talent'
import { TalentDirectory } from './talent-directory'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import type { OrgRole } from '@/lib/types/database'

export default async function TalentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)

  if (!membership) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
        <EmptyState
          icon={Users}
          title="Workspace setup incomplete"
          description="Your workspace couldn't be created automatically. Please check server logs or contact support."
        />
      </div>
    )
  }

  let talent: Awaited<ReturnType<typeof listTalent>> = []
  try {
    talent = await listTalent(membership.org_id)
  } catch (e) {
    console.error('[Talent] Failed to load talent:', e)
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <TalentDirectory talent={talent} role={membership.role as OrgRole} />
    </div>
  )
}
