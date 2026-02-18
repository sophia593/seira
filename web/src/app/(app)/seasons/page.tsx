import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listSeasonsWithStats } from '@/lib/db/seasons'
import { SeasonList } from './season-list'
import { EmptyState } from '@/components/ui/empty-state'
import { Layers } from 'lucide-react'

export default async function SeasonsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)

  if (!membership) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
        <EmptyState
          icon={Layers}
          title="Workspace setup incomplete"
          description="Your workspace couldn't be created automatically. Please check server logs or contact support."
        />
      </div>
    )
  }

  const seasons = await listSeasonsWithStats(membership.org_id)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <SeasonList seasons={seasons} />
    </div>
  )
}
