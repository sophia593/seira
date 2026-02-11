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
  role: OrgRole = 'member'
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
