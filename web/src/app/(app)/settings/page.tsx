import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization, getOrganizationMembersWithProfiles } from '@/lib/db/organizations'
import { WorkspaceForm } from './workspace-form'
import { DangerZone } from './danger-zone'
import { SignOutButton } from './sign-out-button'

export default async function SettingsPage() {
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

  // Fetch admins for transfer ownership dropdown (only if owner)
  let admins: { user_id: string; name: string | null; email: string }[] = []
  if (isOwner) {
    try {
      const members = await getOrganizationMembersWithProfiles(supabase, membership.org_id)
      admins = members
        .filter((m) => m.role === 'admin')
        .map((m) => ({ user_id: m.user_id, name: m.name, email: m.email }))
    } catch {
      // Non-critical
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Section 1 — Workspace */}
      <section className="py-6 border-b border-gray-100 first:pt-0">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Workspace</h2>
        <p className="text-sm text-gray-500 mb-4">Manage your workspace settings.</p>
        <WorkspaceForm orgName={org.name} canRename={canRename} />
      </section>

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
