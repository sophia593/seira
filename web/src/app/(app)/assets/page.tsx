import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listAssets } from '@/lib/db/assets'
import { AssetInventory } from './asset-inventory'
import { EmptyState } from '@/components/ui/empty-state'
import { Package } from 'lucide-react'
import type { OrgRole } from '@/lib/types/database'

export default async function AssetsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)

  if (!membership) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
        <EmptyState
          icon={Package}
          title="Workspace setup incomplete"
          description="Your workspace couldn't be created automatically. Please check server logs or contact support."
        />
      </div>
    )
  }

  const assets = await listAssets(membership.org_id)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <AssetInventory assets={assets} role={membership.role as OrgRole} />
    </div>
  )
}
