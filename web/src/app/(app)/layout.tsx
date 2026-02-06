import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { AppShellProvider } from "./provider"
import { Sidebar, SidebarCollapsed } from "@/components/layout/sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import { TabBar } from "@/components/layout/tab-bar"

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

  return (
    <AppShellProvider initialUser={user}>
      <div className="flex h-screen">
        {/* Desktop sidebar (full) */}
        <Sidebar />

        {/* Tablet sidebar (collapsed / icon-only) */}
        <SidebarCollapsed />

        {/* Main area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mobile top bar */}
          <MobileHeader />

          {/* Content */}
          <main className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
            <div className="mx-auto max-w-5xl w-full">
              {children}
            </div>
          </main>

          {/* Mobile bottom tab bar */}
          <TabBar />
        </div>
      </div>
    </AppShellProvider>
  )
}
