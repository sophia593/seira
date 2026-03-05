'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Film,
  ChevronDown,
  Settings,
  Plus,
} from 'lucide-react'
import { Collapsible } from 'radix-ui'
import { cn } from '@/lib/utils'
import { TEST_PRODUCTIONS } from '@/lib/constants/test-productions'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function SidebarHeaderContent() {
  const { state } = useSidebar()
  const isExpanded = state === 'expanded'

  return (
    <div
      className={cn(
        'flex items-center w-full h-8',
        isExpanded ? 'justify-between px-2' : 'justify-center',
      )}
    >
      <span
        className={cn(
          'text-white font-semibold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-200',
          isExpanded ? 'opacity-100 max-w-24 ml-1' : 'opacity-0 max-w-0 ml-0',
        )}
        style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '16px', fontWeight: 600 }}
      >
        seira
      </span>
      <SidebarTrigger className="text-[#A1A1AA] hover:text-white transition-colors duration-150 shrink-0">
        {isExpanded ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
      </SidebarTrigger>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Productions folder (collapsible)
// ---------------------------------------------------------------------------

const LS_KEY = 'seira-productions-open'

function ProductionsGroup() {
  const { currentPage, isProductionActive } = useSidebarState()
  const isGroupActive = currentPage === 'production'
  const [open, setOpen] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored !== null) setOpen(stored === 'true')
    } catch {}
  }, [])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    try { localStorage.setItem(LS_KEY, String(next)) } catch {}
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {/* Collapsed mode: standalone icon button with tooltip */}
        <SidebarMenuItem className="hidden group-data-[collapsible=icon]:list-item">
          <SidebarMenuButton
            tooltip="Productions"
            isActive={isGroupActive}
            className={isGroupActive ? 'border-l-2 border-l-[#C4363A]' : ''}
          >
            <Film />
            <span>Productions</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Expanded mode: collapsible folder */}
        <Collapsible.Root
          open={open}
          onOpenChange={handleOpenChange}
          className="group/collapsible group-data-[collapsible=icon]:hidden"
        >
          <SidebarMenuItem>
            <Collapsible.Trigger asChild>
              <SidebarMenuButton
                isActive={isGroupActive}
                className={isGroupActive ? 'border-l-2 border-l-[#C4363A]' : ''}
              >
                <Film />
                <span>Productions</span>
                <ChevronDown className="ml-auto !h-4 !w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarMenuButton>
            </Collapsible.Trigger>

            <Collapsible.Content>
              <SidebarMenuSub>
                {TEST_PRODUCTIONS.map((prod) => {
                  const active = isProductionActive(prod.id)
                  return (
                    <SidebarMenuSubItem key={prod.id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={active}
                        className={active ? 'border-l-2 border-l-[#C4363A] bg-sidebar-accent text-white' : ''}
                      >
                        <Link href={`/production/${prod.id}`} className="items-start">
                          <span
                            className="inline-block shrink-0 rounded-full mt-1.5"
                            style={{ width: 6, height: 6, backgroundColor: prod.statusColor }}
                          />
                          <span className="flex flex-col min-w-0">
                            <span
                              className="truncate max-w-[180px]"
                              style={{ fontSize: 13, color: active ? '#FFFFFF' : '#A1A1AA' }}
                            >
                              {prod.name}
                            </span>
                            <span style={{ fontSize: 11, color: '#71717A' }}>{prod.status}</span>
                          </span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                })}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <Link href="/productions/new" className="text-[#A1A1AA] hover:text-[#D4D4D8] transition-colors duration-150">
                      <Plus className="size-3.5 shrink-0" />
                      <span style={{ fontSize: 13 }}>New Production</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </Collapsible.Content>
          </SidebarMenuItem>
        </Collapsible.Root>
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const { isDashboardActive, isSettingsActive } = useSidebarState()

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader>
        <SidebarHeaderContent />
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isDashboardActive}
                tooltip="Dashboard"
                className={isDashboardActive ? 'border-l-2 border-l-[#C4363A]' : ''}
              >
                <Link href="/dashboard">
                  <LayoutGrid />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Productions */}
        <ProductionsGroup />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isSettingsActive}
              tooltip="Settings"
              className={isSettingsActive ? 'border-l-2 border-l-[#C4363A]' : ''}
            >
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
