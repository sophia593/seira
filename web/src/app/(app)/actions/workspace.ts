'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { tryCreateAdminClient } from '@/lib/supabase/admin'

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
