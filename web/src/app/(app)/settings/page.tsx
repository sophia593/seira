import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization } from '@/lib/db/organizations'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { WorkspaceForm } from './workspace-form'
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

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl">
      <Breadcrumbs
        items={[{ label: 'Settings' }]}
        className="mb-6"
      />

      <h1 className="text-2xl font-semibold mb-8">Settings</h1>

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
      <section className="py-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Account</h2>
        <p className="text-sm text-gray-500 mb-4">Sign out or manage your account.</p>
        <SignOutButton />

        <div className="border-l-2 border-red-200 pl-4 mt-6">
          <p className="text-sm font-medium text-gray-900 mb-1">Delete workspace</p>
          <p className="text-sm text-gray-500 mb-3">
            Permanently delete this workspace and all its data. This cannot be undone.
          </p>
          <button
            disabled
            className="inline-flex items-center justify-center px-4 py-2 text-sm border border-red-200 text-red-600 opacity-50 cursor-not-allowed rounded-md"
          >
            Delete workspace
            <span className="ml-2 text-xs text-red-400">Coming soon</span>
          </button>
        </div>
      </section>
    </div>
  )
}
