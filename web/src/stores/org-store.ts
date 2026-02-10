import { create } from 'zustand'
import type { OrgRole } from '@/lib/types/database'

interface OrgState {
  orgId: string | null
  orgName: string | null
  role: OrgRole | null
  isHydrated: boolean

  // Actions
  setOrg: (org: { id: string; name: string; role: OrgRole }) => void
  setHydrated: (hydrated: boolean) => void
  clear: () => void
}

const initialState = {
  orgId: null,
  orgName: null,
  role: null,
  isHydrated: false,
}

export const useOrgStore = create<OrgState>((set) => ({
  ...initialState,

  setOrg: ({ id, name, role }) =>
    set({ orgId: id, orgName: name, role, isHydrated: true }),

  setHydrated: (isHydrated) => set({ isHydrated }),

  clear: () => set(initialState),
}))

// Selectors
export const selectOrgId = (state: OrgState) => state.orgId
export const selectOrgName = (state: OrgState) => state.orgName
export const selectRole = (state: OrgState) => state.role
export const selectIsOrgHydrated = (state: OrgState) => state.isHydrated
