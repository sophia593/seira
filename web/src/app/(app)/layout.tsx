import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserMembership } from "@/lib/db/client"
import { getOrganization } from "@/lib/db/organizations"
import { AppShell } from "@/components/app-shell"
import { AppShellProvider } from "./provider"
import type { OrgRole } from "@/lib/types/database"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Auth check
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  const user = {
    id: data.user.id,
    email: data.user.email ?? "",
    name:
      data.user.user_metadata?.name ||
      data.user.user_metadata?.full_name ||
      null,
    avatar_url: data.user.user_metadata?.avatar_url || null,
  }

  // Org bootstrap: lookup membership, auto-create if missing
  let initialOrg: { id: string; name: string; role: OrgRole } | null = null

  try {
    let membership = await getUserMembership(
      supabase as Parameters<typeof getUserMembership>[0],
      user.id
    )

    if (!membership) {
      // Use admin client to bypass RLS for first-time org creation.
      // The DB trigger `handle_new_org` automatically creates the
      // organization_members row — do NOT insert it manually.
      const admin = createAdminClient()

      const { error: orgError } = await admin
        .from("organizations")
        .insert({ name: "My Workspace", created_by: user.id })

      if (orgError) {
        console.error("[Org bootstrap] Failed to create organization:", orgError)
      } else {
        // Trigger has fired — membership should now exist
        membership = await getUserMembership(
          supabase as Parameters<typeof getUserMembership>[0],
          user.id
        )
        if (!membership) {
          console.error("[Org bootstrap] Org created but membership not found — trigger may have failed")
        }
      }
    }

    if (membership) {
      const org = await getOrganization(
        supabase as Parameters<typeof getOrganization>[0],
        membership.org_id
      )
      if (org) {
        initialOrg = { id: org.id, name: org.name, role: membership.role as OrgRole }
      }
    }
  } catch (e) {
    console.error("[Org bootstrap] Unexpected error:", e)
  }

  return (
    <AppShellProvider initialUser={user} initialOrg={initialOrg}>
      <AppShell>{children}</AppShell>
    </AppShellProvider>
  )
}
