// lib/db/invitations.ts
// Invitation CRUD operations

import { handleDbError, type SupabaseClient } from './client'
import type { Invitation, OrgRole } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

/**
 * List active (pending) invitations for an organization.
 * Requires the caller to be an org admin/owner (enforced by RLS).
 */
export async function listOrgInvitations(
  supabase: SupabaseClient,
  orgId: string
): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    handleDbError(error, 'Failed to list invitations')
  }

  return (data ?? []) as Invitation[]
}

/**
 * Get an invitation by its invite code.
 * Uses admin client to bypass RLS (needed for accept flow).
 */
export async function getInvitationByCode(
  supabase: SupabaseClient,
  code: string
): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invite_code', code)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get invitation')
  }

  return data as Invitation
}

// =============================================================================
// Write Operations
// =============================================================================

/**
 * Create a new invitation link for an organization.
 */
export async function createInvitation(
  supabase: SupabaseClient,
  orgId: string,
  role: OrgRole,
  createdBy: string
): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      org_id: orgId,
      role,
      created_by: createdBy,
    })
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to create invitation')
  }

  return data as Invitation
}

/**
 * Revoke a pending invitation.
 */
export async function revokeInvitation(
  supabase: SupabaseClient,
  invitationId: string,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)
    .eq('org_id', orgId)
    .eq('status', 'pending')

  if (error) {
    handleDbError(error, 'Failed to revoke invitation')
  }
}

/**
 * Accept an invitation. Validates status/expiry, creates org membership,
 * marks invitation as accepted. Uses admin client to bypass RLS.
 */
export async function acceptInvitation(
  adminClient: SupabaseClient,
  code: string,
  userId: string
): Promise<{ orgId: string; orgName: string }> {
  // 1. Fetch and validate invitation
  const invitation = await getInvitationByCode(adminClient, code)

  if (!invitation) {
    throw new Error('Invitation not found')
  }
  if (invitation.status !== 'pending') {
    throw new Error('This invitation has already been used or revoked')
  }
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('This invitation has expired')
  }

  // 2. Check if user is already a member
  const { data: existingMember } = await adminClient
    .from('organization_members')
    .select('user_id')
    .eq('org_id', invitation.org_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingMember) {
    throw new Error('You are already a member of this workspace')
  }

  // 3. Create membership
  const { error: memberError } = await adminClient
    .from('organization_members')
    .insert({
      org_id: invitation.org_id,
      user_id: userId,
      role: invitation.role,
    })

  if (memberError) {
    handleDbError(memberError, 'Failed to join workspace')
  }

  // 4. Mark invitation as accepted
  await adminClient
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_by: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  // 5. Get org name for redirect/display
  const { data: org } = await adminClient
    .from('organizations')
    .select('name')
    .eq('id', invitation.org_id)
    .single()

  return {
    orgId: invitation.org_id,
    orgName: org?.name ?? 'Workspace',
  }
}
