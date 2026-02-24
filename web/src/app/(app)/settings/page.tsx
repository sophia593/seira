import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization, getOrganizationMembersWithProfiles } from '@/lib/db/organizations'
import { listWebhooksByOrg } from '@/lib/db/webhooks'
import { listApiKeysByOrg } from '@/lib/db/api-keys'
import { startTimer } from '@/lib/perf'
import { WorkspaceForm } from './workspace-form'
import { ApprovalCategoryForm } from './approval-category-form'
import { IntegrationsSection } from './integrations-section'
import { DangerZone } from './danger-zone'
import { SignOutButton } from './sign-out-button'
import type { Webhook, ApiKeyDisplay } from '@/lib/types/database'

export default async function SettingsPage() {
  const pageTimer = startTimer('SettingsPage:total')
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const membership = await getUserMembership(supabase, data.user.id)
  if (!membership) {
    redirect('/dashboard')
  }

  const org = await getOrganization(supabase, membership.org_id)
  if (!org) {
    redirect('/dashboard')
  }

  const userName =
    data.user.user_metadata?.name ||
    data.user.user_metadata?.full_name ||
    null
  const userEmail = data.user.email ?? ''
  const displayName = userName || userEmail
  const canRename = membership.role === 'owner' || membership.role === 'admin'
  const isOwner = membership.role === 'owner'

  // Fetch integrations + team data in parallel (all non-critical)
  let webhooks: Webhook[] = []
  let apiKeys: ApiKeyDisplay[] = []
  let admins: { user_id: string; name: string | null; email: string }[] = []

  if (canRename || isOwner) {
    const [webhookResult, apiKeyResult, membersResult] = await Promise.allSettled([
      canRename ? listWebhooksByOrg(membership.org_id) : Promise.resolve([]),
      canRename ? listApiKeysByOrg(membership.org_id) : Promise.resolve([]),
      isOwner ? getOrganizationMembersWithProfiles(supabase, membership.org_id) : Promise.resolve([]),
    ])

    if (webhookResult.status === 'fulfilled') webhooks = webhookResult.value as Webhook[]
    if (apiKeyResult.status === 'fulfilled') apiKeys = apiKeyResult.value as ApiKeyDisplay[]
    if (membersResult.status === 'fulfilled') {
      const members = membersResult.value as Awaited<ReturnType<typeof getOrganizationMembersWithProfiles>>
      admins = members
        .filter((m) => m.role === 'admin')
        .map((m) => ({ user_id: m.user_id, name: m.name, email: m.email }))
    }
  }

  pageTimer.end()
  return (
    <div className="max-w-2xl">
      {/* Section 1 — Workspace */}
      <section className="py-6 border-b border-gray-100 first:pt-0">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Workspace</h2>
        <p className="text-sm text-gray-500 mb-4">Manage your workspace settings.</p>
        <WorkspaceForm orgName={org.name} canRename={canRename} />
      </section>

      {/* Section — Deliverable Approvals */}
      {canRename && (
        <section className="py-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Deliverable Approvals</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose which deliverable categories require admin approval before being marked as proved.
          </p>
          <ApprovalCategoryForm currentCategories={org.settings?.approval_required_categories} />
        </section>
      )}

      {/* Section — Integrations */}
      {canRename && (
        <section className="py-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Integrations</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure API keys, webhooks, and external service connections.
          </p>
          <IntegrationsSection webhooks={webhooks} apiKeys={apiKeys} />
        </section>
      )}

      {/* Section 2 — Profile */}
      <section className="py-6 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Profile</h2>
        <p className="text-sm text-gray-500 mb-4">Your account information.</p>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Name</p>
            <p className="text-sm text-gray-900">{displayName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm text-gray-900">{userEmail}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
            <p className="text-sm text-gray-900 capitalize">{membership.role}</p>
          </div>
        </div>
      </section>

      {/* Section 3 — Account */}
      <section className="py-6 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Account</h2>
        <p className="text-sm text-gray-500 mb-4">Sign out or manage your account.</p>
        <SignOutButton />
      </section>

      {/* Section 4 — Danger Zone (owner only) */}
      {isOwner && (
        <section className="py-6">
          <DangerZone orgName={org.name} admins={admins} />
        </section>
      )}
    </div>
  )
}
