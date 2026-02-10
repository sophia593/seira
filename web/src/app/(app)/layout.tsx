import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AppShell } from "@/components/app-shell"
import { AppShellProvider } from "./provider"
import { createServerClient } from "@supabase/ssr"
import { getUserMembership } from "@/lib/db/client"
import { getOrganization, createOrganization } from "@/lib/db/organizations"
import type { OrgRole } from "@/lib/types/database"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore if called from a Server Component where setting cookies isn't allowed.
          }
        },
      },
    }
  )
  // Use getUser() for server-side auth check (confirms token with Supabase Auth)
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/login")
  }

  // Extract user data for client components
  const user = {
    id: data.user.id,
    email: data.user.email ?? "",
    name:
      data.user.user_metadata?.name ||
      data.user.user_metadata?.full_name ||
      null,
    avatar_url: data.user.user_metadata?.avatar_url || null,
  }

  // Get or create organization membership
  let membership = await getUserMembership(supabase as Parameters<typeof getUserMembership>[0], user.id)

  if (!membership) {
    // Auto-create organization for new users
    const orgName = user.name ? `${user.name}'s Team` : 'My Team'
    const org = await createOrganization(
      supabase as Parameters<typeof createOrganization>[0],
      user.id,
      orgName
    )
    // After creating org, user is automatically added as owner
    membership = await getUserMembership(supabase as Parameters<typeof getUserMembership>[0], user.id)
  }

  // Fetch org details
  const org = membership
    ? await getOrganization(supabase as Parameters<typeof getOrganization>[0], membership.org_id)
    : null

  const initialOrg = membership && org
    ? { id: org.id, name: org.name, role: membership.role as OrgRole }
    : null

  return (
    <AppShellProvider initialUser={user} initialOrg={initialOrg}>
      <AppShell>{children}</AppShell>
    </AppShellProvider>
  )
}
