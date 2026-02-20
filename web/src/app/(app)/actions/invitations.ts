'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { getUserMembership } from '@/lib/db/client'
import {
  createInvitation,
  revokeInvitation,
  acceptInvitation,
} from '@/lib/db/invitations'
import { createNotification, notifyOrgAdmins } from '@/lib/db/notifications'
import { getOrganization } from '@/lib/db/organizations'
import { canInviteMembers } from '@/lib/permissions'
import { isUuid } from '@/lib/validation'
import { sendEmail } from '@/lib/email/send'
import { inviteEmailSubject, inviteEmailHtml } from '@/lib/email/templates/invite'
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
// Create Invite
// ---------------------------------------------------------------------------

export async function createInviteAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; inviteUrl?: string; emailSent?: boolean }> {
  try {
    const auth = await getAuthenticatedMembership()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canInviteMembers(auth.role)) {
      return { ok: false, error: 'Only admins can create invitations' }
    }

    const role = (formData.get('role') as string) || 'contributor'
    if (!['admin', 'contributor', 'viewer'].includes(role)) {
      return { ok: false, error: 'Invalid role' }
    }

    const email = (formData.get('email') as string)?.trim() || null

    const invitation = await createInvitation(
      auth.supabase,
      auth.orgId,
      role as OrgRole,
      auth.userId
    )

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'invited', targetType: 'invite', targetId: invitation.id, details: { role, actor_email: auth.userEmail } })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/invite/${invitation.invite_code}`

    // Send invite email if address provided
    let emailSent = false
    if (email) {
      const org = await getOrganization(auth.supabase, auth.orgId)
      const orgName = org?.name ?? 'your workspace'

      // Get inviter name from auth user
      const { data: { user } } = await auth.supabase.auth.getUser()
      const inviterName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A teammate'

      emailSent = await sendEmail({
        to: email,
        subject: inviteEmailSubject({ orgName }),
        html: inviteEmailHtml({ inviterName, orgName, role, inviteUrl }),
      })
    }

    revalidatePath('/settings/team')
    return { ok: true, inviteUrl, emailSent }
  } catch (err) {
    console.error('createInviteAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create invitation' }
  }
}

// ---------------------------------------------------------------------------
// Revoke Invite
// ---------------------------------------------------------------------------

export async function revokeInviteAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedMembership()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canInviteMembers(auth.role)) {
      return { ok: false, error: 'Only owners and admins can revoke invitations' }
    }

    const invitationId = formData.get('invitation_id') as string | null
    if (!invitationId || !isUuid(invitationId)) {
      return { ok: false, error: 'Invalid invitation ID' }
    }

    await revokeInvitation(auth.supabase, invitationId, auth.orgId)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'revoked_invite', targetType: 'invite', targetId: invitationId, details: { actor_email: auth.userEmail } })

    revalidatePath('/settings/team')
    return { ok: true }
  } catch (err) {
    console.error('revokeInviteAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to revoke invitation' }
  }
}

// ---------------------------------------------------------------------------
// Accept Invite
// ---------------------------------------------------------------------------

export async function acceptInviteAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; orgName?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Not authenticated' }
    }

    const code = formData.get('code') as string | null
    if (!code) {
      return { ok: false, error: 'Invitation code is required' }
    }

    const admin = tryCreateAdminClient()
    if (!admin) {
      return { ok: false, error: 'Server configuration error' }
    }

    const { orgId, orgName } = await acceptInvitation(admin, code, user.id)

    logActivity({ orgId, userId: user.id, action: 'accepted_invite', targetType: 'invite', details: { actor_email: user.email ?? '' } })

    // Notify org admins that someone joined
    const userName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Someone'

    await notifyOrgAdmins(admin, orgId, user.id, {
      type: 'member_joined',
      title: `${userName} joined the workspace`,
      link: '/settings/team',
    })

    revalidatePath('/')
    return { ok: true, orgName }
  } catch (err) {
    console.error('acceptInviteAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to accept invitation' }
  }
}
