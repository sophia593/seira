'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { getUserMembership } from '@/lib/db/client'
import { updateOrganization } from '@/lib/db/organizations'

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
