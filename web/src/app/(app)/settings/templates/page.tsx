import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listTemplates } from '@/lib/db/templates'
import { canManageTemplates } from '@/lib/permissions'
import type { OrgRole } from '@/lib/types/database'
import { TemplateList } from './template-list'

export default async function TemplatesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const membership = await getUserMembership(supabase, data.user.id)
  if (!membership) {
    redirect('/dashboard')
  }

  const role = membership.role as OrgRole
  const isManager = canManageTemplates(role)
  const orgId = membership.org_id

  const templates = await listTemplates(supabase, orgId, { includeGlobal: true })

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900">Deliverable Templates</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Reusable deliverable packages that can be applied to any partner.
        </p>
      </div>

      <TemplateList templates={templates} orgId={orgId} isManager={isManager} />
    </div>
  )
}
