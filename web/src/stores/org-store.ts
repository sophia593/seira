import { create } from 'zustand'
import type { OrgRole, DeliverableCategory } from '@/lib/types/database'

interface OrgState {
  orgId: string | null
  orgName: string | null
  role: OrgRole | null
  approvalCategories: DeliverableCategory[]
  isHydrated: boolean

  // Actions
  setOrg: (org: { id: string; name: string; role: OrgRole; approvalCategories?: DeliverableCategory[] }) => void
  setHydrated: (hydrated: boolean) => void
  clear: () => void
}

const DEFAULT_APPROVAL_CATEGORIES: DeliverableCategory[] = ['talent']

const initialState = {
  orgId: null,
  orgName: null,
  role: null,
  approvalCategories: DEFAULT_APPROVAL_CATEGORIES,
  isHydrated: false,
}

export const useOrgStore = create<OrgState>((set) => ({
  ...initialState,

  setOrg: ({ id, name, role, approvalCategories }) =>
    set({ orgId: id, orgName: name, role, approvalCategories: approvalCategories ?? DEFAULT_APPROVAL_CATEGORIES, isHydrated: true }),

  setHydrated: (isHydrated) => set({ isHydrated }),

  clear: () => set(initialState),
}))

// Selectors
export const selectOrgId = (state: OrgState) => state.orgId
export const selectOrgName = (state: OrgState) => state.orgName
export const selectRole = (state: OrgState) => state.role
export const selectIsOrgHydrated = (state: OrgState) => state.isHydrated
