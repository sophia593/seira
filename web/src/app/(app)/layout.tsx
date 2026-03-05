import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { AppShellProvider } from "./provider"

export default async function AuthenticatedLayout({
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

  return (
    <AppShellProvider initialUser={user}>
      <SidebarProvider
        style={{
          "--sidebar-width": "260px",
          "--sidebar-width-icon": "72px",
        } as React.CSSProperties}
      >
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--content-bg)" }}>
          <TopBar />
          <div className="flex-1 overflow-y-auto seira-scroll">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </AppShellProvider>
  )
}
