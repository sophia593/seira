import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { getUserMembership } from "@/lib/db/client"
import { getOrganization } from "@/lib/db/organizations"
import { listEvents } from "@/lib/db/events"
import { AppShell } from "@/components/app-shell"
import { AppShellProvider } from "./provider"
import { CreateWorkspaceForm } from "./create-workspace-form"
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

  // ---------------------------------------------------------------------------
  // Org bootstrap: lookup membership, auto-create once if missing
  // ---------------------------------------------------------------------------
  let initialOrg: { id: string; name: string; role: OrgRole } | null = null

  try {
    // 1. Check existing membership
    let membership = await getUserMembership(supabase, user.id)

    // 2. If no membership, try auto-creating via admin client (once)
    if (!membership) {
      console.warn('[Org bootstrap] No membership via anon client for user', user.id, '— attempting admin bootstrap')
      const admin = tryCreateAdminClient()

      if (admin) {
        // Only create if the user doesn't already have an org
        // (guards against duplicate creation on retry)
        const { data: existingMember } = await admin
          .from("organization_members")
          .select("org_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle()

        if (existingMember) {
          // Org exists but anon client couldn't read it — use admin data
          membership = {
            user_id: user.id,
            org_id: existingMember.org_id,
            role: "owner" as OrgRole,
            created_at: new Date().toISOString(),
          }
        } else {
          // Create new org — trigger `handle_new_org` creates the member row
          const { error: orgError } = await admin
            .from("organizations")
            .insert({ name: "My Workspace", created_by: user.id })

          if (orgError) {
            console.error("[Org bootstrap] Failed to create org:", orgError)
          } else {
            // Re-read membership via admin (bypasses RLS SELECT too)
            const { data: newMember } = await admin
              .from("organization_members")
              .select("*")
              .eq("user_id", user.id)
              .limit(1)
              .maybeSingle()

            if (newMember) {
              membership = newMember
            } else {
              console.error("[Org bootstrap] Org created but trigger did not create membership")
            }
          }
        }
      } else {
        console.error("[Org bootstrap] No admin client — SUPABASE_SERVICE_ROLE_KEY not set")
      }
    }

    // 3. Resolve org details
    if (membership) {
      const admin = tryCreateAdminClient()
      // Try admin read first (bypasses RLS), fall back to anon
      let org = null
      if (admin) {
        const { data } = await admin
          .from("organizations")
          .select("*")
          .eq("id", membership.org_id)
          .single()
        org = data
      }
      if (!org) {
        org = await getOrganization(supabase, membership.org_id)
      }
      if (org) {
        initialOrg = {
          id: org.id,
          name: org.name,
          role: (membership.role as OrgRole) ?? "owner",
        }
      }
    }
  } catch (e) {
    console.error("[Org bootstrap] Unexpected error:", e)
  }

  // ---------------------------------------------------------------------------
  // If no org after bootstrap, show the workspace creation form
  // ---------------------------------------------------------------------------
  if (!initialOrg) {
    return (
      <AppShellProvider initialUser={user} initialOrg={null}>
        <CreateWorkspaceForm />
      </AppShellProvider>
    )
  }

  // Fetch recent events for sidebar (best-effort, don't block on failure)
  let recentEvents: { id: string; name: string; status: string }[] = []
  try {
    const allEvents = await listEvents(initialOrg.id)
    recentEvents = allEvents.slice(0, 3).map((e) => ({
      id: e.id,
      name: e.name,
      status: e.status,
    }))
  } catch {
    // Non-critical — sidebar just won't show recent events
  }

  return (
    <AppShellProvider initialUser={user} initialOrg={initialOrg}>
      <AppShell recentEvents={recentEvents}>{children}</AppShell>
    </AppShellProvider>
  )
}
