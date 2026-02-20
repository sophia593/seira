'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { getUserMembership } from '@/lib/db/client'
import { getOrganization, getOrganizationMembers, getOrganizationMembersWithProfiles, updateMemberRole, removeOrganizationMember } from '@/lib/db/organizations'
import { createNotification } from '@/lib/db/notifications'
import { canChangeRole, canRemoveMember } from '@/lib/permissions'
import { isUuid } from '@/lib/validation'
import { sendEmail } from '@/lib/email/send'
import { teamNotificationEmailSubject, teamNotificationEmailHtml } from '@/lib/email/templates/team-notification'
import { logActivity } from '@/lib/db/activity-log'
import type { OrgRole } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getAuthenticatedMembership() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' as const }
  }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) {
    return { error: 'No organization membership' as const }
  }

  return { supabase, userId: user.id, userEmail: user.email ?? '', orgId: membership.org_id, role: membership.role as OrgRole }
}

// ---------------------------------------------------------------------------
// Update Member Role
// ---------------------------------------------------------------------------

export async function updateMemberRoleAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedMembership()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canChangeRole(auth.role)) {
      return { ok: false, error: 'Only admins can change member roles' }
    }

    const targetUserId = formData.get('user_id') as string | null
    if (!targetUserId || !isUuid(targetUserId)) {
      return { ok: false, error: 'Invalid user ID' }
    }

    const newRole = formData.get('role') as string | null
    if (!newRole || !['admin', 'contributor', 'viewer'].includes(newRole)) {
      return { ok: false, error: 'Invalid role' }
    }

    // Can't change own role
    if (targetUserId === auth.userId) {
      return { ok: false, error: 'You cannot change your own role' }
    }

    // Verify target exists and is not the owner
    const members = await getOrganizationMembers(auth.supabase, auth.orgId)
    const target = members.find((m) => m.user_id === targetUserId)
    if (!target) {
      return { ok: false, error: 'Member not found' }
    }
    if (target.role === 'owner') {
      return { ok: false, error: "Cannot change the owner's role" }
    }

    await updateMemberRole(auth.supabase, auth.orgId, targetUserId, newRole as OrgRole)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'role_changed', targetType: 'member', targetId: targetUserId, details: { from: target.role, to: newRole, actor_email: auth.userEmail } })

    // Notify the target user (in-app + email)
    const admin = tryCreateAdminClient()
    if (admin) {
      await createNotification(admin, {
        userId: targetUserId,
        orgId: auth.orgId,
        type: 'role_changed',
        title: `Your role was changed to ${newRole}`,
        link: '/settings/team',
      })

      // Send email notification
      const [membersWithProfiles, org] = await Promise.all([
        getOrganizationMembersWithProfiles(auth.supabase, auth.orgId),
        getOrganization(auth.supabase, auth.orgId),
      ])
      const targetProfile = membersWithProfiles.find((m) => m.user_id === targetUserId)
      if (targetProfile?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const subject = `Your role in ${org?.name ?? 'your workspace'} was updated`
        sendEmail({
          to: targetProfile.email,
          subject: teamNotificationEmailSubject({ subject }),
          html: teamNotificationEmailHtml({
            userName: targetProfile.name || targetProfile.email.split('@')[0],
            subject,
            body: `Your role in ${org?.name ?? 'your workspace'} has been changed to ${newRole}. Your permissions have been updated accordingly.`,
            ctaUrl: `${baseUrl}/settings/team`,
            ctaLabel: 'View team settings',
          }),
        }).catch(() => {}) // Non-critical
      }
    }

    revalidatePath('/settings/team')
    return { ok: true }
  } catch (err) {
    console.error('updateMemberRoleAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update role' }
  }
}

// ---------------------------------------------------------------------------
// Remove Member
// ---------------------------------------------------------------------------

export async function removeMemberAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedMembership()
    if ('error' in auth) return { ok: false, error: auth.error }

    const targetUserId = formData.get('user_id') as string | null
    if (!targetUserId || !isUuid(targetUserId)) {
      return { ok: false, error: 'Invalid user ID' }
    }

    // Can't remove yourself
    if (targetUserId === auth.userId) {
      return { ok: false, error: 'You cannot remove yourself from the workspace' }
    }

    // Look up the target's actual role from the database (don't trust client data)
    const orgMembers = await getOrganizationMembers(auth.supabase, auth.orgId)
    const targetMember = orgMembers.find((m) => m.user_id === targetUserId)
    if (!targetMember) {
      return { ok: false, error: 'Member not found' }
    }

    if (!canRemoveMember(auth.role, targetMember.role)) {
      return { ok: false, error: 'You do not have permission to remove this member' }
    }

    // Fetch target's profile + org name before removal (join won't work after)
    const [membersWithProfiles, org] = await Promise.all([
      getOrganizationMembersWithProfiles(auth.supabase, auth.orgId),
      getOrganization(auth.supabase, auth.orgId),
    ])
    const targetProfile = membersWithProfiles.find((m) => m.user_id === targetUserId)

    await removeOrganizationMember(auth.supabase, auth.orgId, targetUserId)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'removed_member', targetType: 'member', targetId: targetUserId, details: { actor_email: auth.userEmail } })

    // Notify the removed user (in-app + email)
    const admin = tryCreateAdminClient()
    if (admin) {
      await createNotification(admin, {
        userId: targetUserId,
        orgId: auth.orgId,
        type: 'member_removed',
        title: 'You were removed from the workspace',
      })

      // Send email notification
      if (targetProfile?.email) {
        const orgName = org?.name ?? 'your workspace'
        const subject = `You were removed from ${orgName}`
        sendEmail({
          to: targetProfile.email,
          subject: teamNotificationEmailSubject({ subject }),
          html: teamNotificationEmailHtml({
            userName: targetProfile.name || targetProfile.email.split('@')[0],
            subject,
            body: `You have been removed from ${orgName}. You no longer have access to its events, partners, or deliverables. If you believe this was a mistake, please contact the workspace administrator.`,
          }),
        }).catch(() => {}) // Non-critical
      }
    }

    revalidatePath('/settings/team')
    return { ok: true }
  } catch (err) {
    console.error('removeMemberAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to remove member' }
  }
}
