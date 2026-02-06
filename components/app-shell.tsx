import { Sidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"
import { Header } from "./header"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 px-4 md:px-8 py-8 pb-20 md:pb-8 mx-auto w-full max-w-5xl">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
