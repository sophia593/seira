import { tryCreateAdminClient } from '@/lib/supabase/admin'

export interface OrgMemberWithEmail {
  user_id: string
  role: string
  email: string
  name: string | null
}

/** Fetch org owners and admins with email addresses. Uses admin client to bypass RLS. */
export async function getOrgAdminsWithEmails(orgId: string): Promise<OrgMemberWithEmail[]> {
  const admin = tryCreateAdminClient()
  if (!admin) return []

  try {
    const { data } = await admin
      .from('organization_members')
      .select('user_id, role, users(email, name)')
      .eq('org_id', orgId)
      .in('role', ['owner', 'admin'])

    return (data ?? []).map((row: Record<string, unknown>) => {
      const user = (Array.isArray(row.users) ? row.users[0] : row.users) as {
        email: string
        name: string | null
      } | null
      return {
        user_id: row.user_id as string,
        role: row.role as string,
        email: user?.email ?? '',
        name: user?.name ?? null,
      }
    }).filter((m) => m.email)
  } catch (err) {
    console.error('[getOrgAdminsWithEmails] failed:', err)
    return []
  }
}
