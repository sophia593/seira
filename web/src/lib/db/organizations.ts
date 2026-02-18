// lib/db/organizations.ts
// Organization CRUD operations

import { handleDbError, type SupabaseClient } from './client'
import type { Organization, OrganizationMember, OrgRole } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

export async function getOrganization(
  supabase: SupabaseClient,
  orgId: string
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    handleDbError(error, 'Failed to get organization')
  }

  return data as Organization
}

export async function getOrganizationMembers(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (error) {
    handleDbError(error, 'Failed to get organization members')
  }

  return (data ?? []) as OrganizationMember[]
}

export async function getUserOrganizations(
  supabase: SupabaseClient,
  userId: string
): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('org_id, organizations(*)')
    .eq('user_id', userId)

  if (error) {
    handleDbError(error, 'Failed to get user organizations')
  }

  // Extract organizations from the join
  return (data ?? [])
    .map((row) => {
      const r = row as { organizations: Organization | Organization[] | null }
      // Handle both single and array results from join
      if (Array.isArray(r.organizations)) {
        return r.organizations[0] ?? null
      }
      return r.organizations
    })
    .filter((org): org is Organization => org !== null)
}

export interface UserOrgWithRole {
  id: string
  name: string
  role: OrgRole
  created_at: string
}

/**
 * Get all organizations a user belongs to, including their role in each.
 */
export async function getUserOrganizationsWithRoles(
  supabase: SupabaseClient,
  userId: string
): Promise<UserOrgWithRole[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name, created_at)')
    .eq('user_id', userId)

  if (error) {
    handleDbError(error, 'Failed to get user organizations with roles')
  }

  return (data ?? [])
    .map((row) => {
      const r = row as { role: OrgRole; organizations: Organization | Organization[] | null }
      const org = Array.isArray(r.organizations) ? r.organizations[0] ?? null : r.organizations
      if (!org) return null
      return {
        id: org.id,
        name: org.name,
        role: r.role,
        created_at: org.created_at,
      }
    })
    .filter((item): item is UserOrgWithRole => item !== null)
}

export interface MemberWithProfile {
  user_id: string
  org_id: string
  role: OrgRole
  created_at: string
  name: string | null
  email: string
  avatar_url: string | null
}

/**
 * Get organization members with profile data (name, email, avatar).
 * Joins organization_members with the users table.
 */
export async function getOrganizationMembersWithProfiles(
  supabase: SupabaseClient,
  orgId: string
): Promise<MemberWithProfile[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id, org_id, role, created_at, users(name, email, avatar_url)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (error) {
    handleDbError(error, 'Failed to get organization members with profiles')
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      user_id: string
      org_id: string
      role: OrgRole
      created_at: string
      users: { name: string | null; email: string; avatar_url: string | null } | { name: string | null; email: string; avatar_url: string | null }[] | null
    }
    // Handle both single object and array results from Supabase join
    const user = Array.isArray(r.users) ? r.users[0] ?? null : r.users
    return {
      user_id: r.user_id,
      org_id: r.org_id,
      role: r.role,
      created_at: r.created_at,
      name: user?.name ?? null,
      email: user?.email ?? '',
      avatar_url: user?.avatar_url ?? null,
    }
  })
}

// =============================================================================
// Write Operations
// =============================================================================

export async function createOrganization(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<Organization> {
  // Create the organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      created_by: userId,
    })
    .select()
    .single()

  if (orgError) {
    handleDbError(orgError, 'Failed to create organization')
  }

  // Add creator as owner
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      user_id: userId,
      org_id: org.id,
      role: 'owner' as OrgRole,
    })

  if (memberError) {
    // Rollback org creation on member insert failure
    await supabase.from('organizations').delete().eq('id', org.id)
    handleDbError(memberError, 'Failed to add organization member')
  }

  return org as Organization
}

export async function updateOrganization(
  supabase: SupabaseClient,
  orgId: string,
  updates: Partial<Pick<Organization, 'name'>>
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update organization')
  }

  return data as Organization
}

export async function addOrganizationMember(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  role: OrgRole = 'contributor'
): Promise<OrganizationMember> {
  const { data, error } = await supabase
    .from('organization_members')
    .insert({
      org_id: orgId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to add organization member')
  }

  return data as OrganizationMember
}

export async function updateMemberRole(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  role: OrgRole
): Promise<OrganizationMember> {
  const { data, error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    handleDbError(error, 'Failed to update member role')
  }

  return data as OrganizationMember
}

export async function removeOrganizationMember(
  supabase: SupabaseClient,
  orgId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId)

  if (error) {
    handleDbError(error, 'Failed to remove organization member')
  }
}

/**
 * Transfer ownership from current owner to a new user.
 * Demotes the current owner to admin and promotes the target to owner.
 */
export async function transferOwnership(
  supabase: SupabaseClient,
  orgId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<void> {
  // Demote current owner to admin
  const { error: demoteError } = await supabase
    .from('organization_members')
    .update({ role: 'admin' })
    .eq('org_id', orgId)
    .eq('user_id', currentOwnerId)

  if (demoteError) {
    handleDbError(demoteError, 'Failed to demote current owner')
  }

  // Promote new owner
  const { error: promoteError } = await supabase
    .from('organization_members')
    .update({ role: 'owner' })
    .eq('org_id', orgId)
    .eq('user_id', newOwnerId)

  if (promoteError) {
    // Rollback: restore original owner
    await supabase
      .from('organization_members')
      .update({ role: 'owner' })
      .eq('org_id', orgId)
      .eq('user_id', currentOwnerId)
    handleDbError(promoteError, 'Failed to promote new owner')
  }

  // Update organizations.created_by to reflect new owner
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ created_by: newOwnerId })
    .eq('id', orgId)

  if (orgError) {
    console.error('[transferOwnership] Failed to update created_by:', orgError)
  }
}

/**
 * Delete an organization and all related data.
 * Uses admin client to bypass RLS. CASCADE handles child rows.
 */
export async function deleteOrganization(
  supabase: SupabaseClient,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId)

  if (error) {
    handleDbError(error, 'Failed to delete organization')
  }
}
