import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrganizationMembersWithProfiles } from '@/lib/db/organizations'
import { listOrgInvitations } from '@/lib/db/invitations'
import { canManageTeam } from '@/lib/permissions'
import type { OrgRole } from '@/lib/types/database'
import { TeamMembers } from './team-members'
import { PendingInvites } from './pending-invites'
import { InviteDialog } from './invite-dialog'

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
    <div className="max-w-2xl">
      {/* Header + Invite button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {isManager && <InviteDialog />}
      </div>

      {/* Members list */}
      <TeamMembers
        members={members}
        currentUserId={data.user.id}
        currentUserRole={role}
      />

      {/* Pending invitations (admin/owner only) */}
      {isManager && invitations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Pending Invitations</h2>
          <p className="text-sm text-gray-500 mb-4">{invitations.length} active invite{invitations.length !== 1 ? 's' : ''}</p>
          <PendingInvites invitations={invitations} />
        </div>
      )}
    </div>
  )
}
