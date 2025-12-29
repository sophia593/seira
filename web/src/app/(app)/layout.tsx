import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { AppShellProvider } from "./provider"
import { createServerClient } from "@supabase/ssr"

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
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Mobile Header */}
        <MobileNav />

        {/* Mobile Sidebar (drawer) */}
        <MobileSidebar />

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </AppShellProvider>
  )
}
