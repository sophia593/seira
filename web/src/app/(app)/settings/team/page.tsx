import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganizationMembersWithProfiles } from '@/lib/db/organizations'
import { listOrgInvitations } from '@/lib/db/invitations'
import { canManageTeam } from '@/lib/permissions'
import type { OrgRole } from '@/lib/types/database'
import { TeamMembers } from './team-members'
import { PendingInvites } from './pending-invites'

export default async function TeamPage() {
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
  const isManager = canManageTeam(role)

  // Fetch members and invitations in parallel
  const [members, invitations] = await Promise.all([
    getOrganizationMembersWithProfiles(supabase, membership.org_id),
    isManager ? listOrgInvitations(supabase, membership.org_id).catch(() => []) : Promise.resolve([]),
  ])

  return (
    <div className="max-w-4xl">
      {/* Members list (includes header + stats + search/filter + cards) */}
      <TeamMembers
        members={members}
        currentUserId={data.user.id}
        currentUserRole={role}
        isManager={isManager}
      />

      {/* Pending invitations (admin/owner only) */}
      {isManager && invitations.length > 0 && (
        <div className="mt-10">
          <PendingInvites invitations={invitations} />
        </div>
      )}
    </div>
  )
}
