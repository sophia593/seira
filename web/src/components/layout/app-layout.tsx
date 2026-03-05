'use client'

import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar'

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar()
  const Icon = state === 'expanded' ? ChevronsLeft : ChevronsRight

  return (
    <button
      onClick={toggleSidebar}
      className="flex items-center justify-center size-7 rounded-md text-[#A1A1AA] hover:text-white transition-colors duration-150"
      aria-label="Toggle sidebar"
    >
      <Icon className="size-4" />
    </button>
  )
}

function AppSidebar() {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex-row items-center justify-between px-4 py-3">
        <span className="text-[16px] font-semibold text-white group-data-[collapsible=icon]:hidden">
          Seira
        </span>
        <SidebarToggle />
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter />
    </Sidebar>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main
        style={{
          flex: 1,
          backgroundColor: 'var(--content-bg)',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
    </SidebarProvider>
  )
}
