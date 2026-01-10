import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarState {
  // State
  isCollapsed: boolean
  isMobileOpen: boolean
  isHydrated: boolean

  // Actions
  toggle: () => void
  collapse: () => void
  expand: () => void
  openMobile: () => void
  closeMobile: () => void
  setHydrated: () => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      isHydrated: false,

      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

      collapse: () => set({ isCollapsed: true }),

      expand: () => set({ isCollapsed: false }),

      openMobile: () => set({ isMobileOpen: true }),

      closeMobile: () => set({ isMobileOpen: false }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "sidebar-state",
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)

// Selectors (prevent unnecessary re-renders)
export const selectIsCollapsed = (state: SidebarState) => state.isCollapsed
export const selectIsMobileOpen = (state: SidebarState) => state.isMobileOpen
export const selectIsHydrated = (state: SidebarState) => state.isHydrated
