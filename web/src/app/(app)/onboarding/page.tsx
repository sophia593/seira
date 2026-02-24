import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization } from '@/lib/db/organizations'
import { listGlobalTemplates } from '@/lib/db/templates'
import type { OrgSettings } from '@/lib/types/database'
import { OnboardingWizard } from './onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) redirect('/login')

  const org = await getOrganization(supabase, membership.org_id)
  if (!org) redirect('/login')

  const settings = (org.settings ?? {}) as OrgSettings
  if (settings.onboarding_completed) redirect('/dashboard')

  const globalTemplates = await listGlobalTemplates(supabase)

  return (
    <OnboardingWizard
      orgId={org.id}
      currentOrgName={org.name}
      currentOrgType={settings.org_type}
      globalTemplates={globalTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        industry: t.industry,
        deliverables: t.deliverables,
      }))}
    />
  )
}
