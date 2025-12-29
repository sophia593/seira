import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggle: () => void
  setCollapsed: (collapsed: boolean) => void
  setMobileOpen: (open: boolean) => void
  closeMobile: () => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,

      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

      setCollapsed: (isCollapsed) => set({ isCollapsed }),

      setMobileOpen: (isMobileOpen) => set({ isMobileOpen }),

      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: "sidebar-state",
      // Only persist isCollapsed, not isMobileOpen
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
)
