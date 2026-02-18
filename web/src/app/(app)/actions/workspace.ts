'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { getUserMembership, getUserMembershipForOrg } from '@/lib/db/client'
import { updateOrganization, deleteOrganization, transferOwnership, getUserOrganizationsWithRoles, getOrganization } from '@/lib/db/organizations'
import { canDeleteWorkspace, canTransferOwnership } from '@/lib/permissions'
import { isUuid } from '@/lib/validation'
import type { OrgRole } from '@/lib/types/database'

export async function createWorkspaceAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Not authenticated' }

    const name = (formData.get('name') as string)?.trim()
    if (!name) return { ok: false, error: 'Workspace name is required' }

    const admin = tryCreateAdminClient()
    if (!admin) {
      console.error('[createWorkspaceAction] No admin client — SUPABASE_SERVICE_ROLE_KEY is not set')
      return { ok: false, error: 'Server configuration error — SUPABASE_SERVICE_ROLE_KEY is not set' }
    }

    // Create org — the DB trigger `handle_new_org` creates the member row
    const { error: orgError } = await admin
      .from('organizations')
      .insert({ name, created_by: user.id })

    if (orgError) {
      console.error('[createWorkspaceAction] Supabase error:', JSON.stringify(orgError))
      return { ok: false, error: orgError.message || 'Failed to create workspace' }
    }

    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    console.error('[createWorkspaceAction] Unexpected error:', JSON.stringify(err, Object.getOwnPropertyNames(err as object)))
    return { ok: false, error: 'Something went wrong' }
  }
}

export async function renameWorkspaceAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) return { ok: false, error: 'No organization membership' }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return { ok: false, error: 'Only owners and admins can rename the workspace' }
    }

    const name = (formData.get('name') as string)?.trim()
    if (!name || name.length < 2) {
      return { ok: false, error: 'Workspace name must be at least 2 characters' }
    }
    if (name.length > 60) {
      return { ok: false, error: 'Workspace name must be 60 characters or fewer' }
    }

    await updateOrganization(supabase, membership.org_id, { name })

    revalidatePath('/')
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath('/events')

    return { ok: true }
  } catch (err) {
    console.error('[renameWorkspaceAction] error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to rename workspace' }
  }
}

export async function deleteWorkspaceAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) return { ok: false, error: 'No organization membership' }

    if (!canDeleteWorkspace(membership.role as OrgRole)) {
      return { ok: false, error: 'Only the workspace owner can delete it' }
    }

    const confirmName = (formData.get('confirm_name') as string)?.trim()
    if (!confirmName) {
      return { ok: false, error: 'Please type the workspace name to confirm' }
    }

    const admin = tryCreateAdminClient()
    if (!admin) {
      return { ok: false, error: 'Server configuration error' }
    }

    // Verify the confirm name matches
    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', membership.org_id)
      .single()

    if (!org || org.name !== confirmName) {
      return { ok: false, error: 'Workspace name does not match' }
    }

    await deleteOrganization(admin, membership.org_id)

    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    console.error('[deleteWorkspaceAction] error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete workspace' }
  }
}

export async function transferOwnershipAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) return { ok: false, error: 'No organization membership' }

    if (!canTransferOwnership(membership.role as OrgRole)) {
      return { ok: false, error: 'Only the workspace owner can transfer ownership' }
    }

    const newOwnerId = formData.get('new_owner_id') as string | null
    if (!newOwnerId || !isUuid(newOwnerId)) {
      return { ok: false, error: 'Invalid user ID' }
    }

    if (newOwnerId === user.id) {
      return { ok: false, error: 'You are already the owner' }
    }

    const admin = tryCreateAdminClient()
    if (!admin) {
      return { ok: false, error: 'Server configuration error' }
    }

    await transferOwnership(admin, membership.org_id, user.id, newOwnerId)

    revalidatePath('/')
    revalidatePath('/settings')
    revalidatePath('/settings/team')

    return { ok: true }
  } catch (err) {
    console.error('[transferOwnershipAction] error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to transfer ownership' }
  }
}

export async function listWorkspacesAction(): Promise<{
  ok: boolean
  workspaces?: { id: string; name: string; role: OrgRole }[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const workspaces = await getUserOrganizationsWithRoles(supabase, user.id)

    return {
      ok: true,
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, role: w.role as OrgRole })),
    }
  } catch (err) {
    console.error('[listWorkspacesAction] error:', err)
    return { ok: false, error: 'Failed to list workspaces' }
  }
}

export async function switchWorkspaceAction(
  formData: FormData
): Promise<{ ok: boolean; org?: { id: string; name: string; role: OrgRole }; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Not authenticated' }

    const orgId = formData.get('org_id') as string | null
    if (!orgId || !isUuid(orgId)) {
      return { ok: false, error: 'Invalid workspace ID' }
    }

    // Verify user has membership in this org
    const membership = await getUserMembershipForOrg(supabase, user.id, orgId)
    if (!membership) {
      return { ok: false, error: 'You are not a member of this workspace' }
    }

    // Get org details
    const org = await getOrganization(supabase, orgId)
    if (!org) {
      return { ok: false, error: 'Workspace not found' }
    }

    // Set cookie for persistence
    const cookieStore = await cookies()
    cookieStore.set('seira_org_id', orgId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    revalidatePath('/')

    return {
      ok: true,
      org: { id: org.id, name: org.name, role: membership.role as OrgRole },
    }
  } catch (err) {
    console.error('[switchWorkspaceAction] error:', err)
    return { ok: false, error: 'Failed to switch workspace' }
  }
}
