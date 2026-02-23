import { useOrgStore } from '@/stores/org-store'
import type { OrgRole, DeliverableCategory } from '@/lib/types/database'

interface UseOrgResult {
  orgId: string
  orgName: string
  role: OrgRole
  isOwner: boolean
  isAdmin: boolean
  canEdit: boolean
  approvalCategories: DeliverableCategory[]
}

/**
 * Hook to access organization context.
 * Returns safe defaults (viewer-level permissions) before store hydration
 * to prevent SSR crashes. Re-renders with real values once hydrated.
 */
export function useOrg(): UseOrgResult {
  const orgId = useOrgStore((state) => state.orgId)
  const orgName = useOrgStore((state) => state.orgName)
  const role = useOrgStore((state) => state.role)
  const approvalCategories = useOrgStore((state) => state.approvalCategories)

  if (!orgId || !orgName || !role) {
    return {
      orgId: orgId ?? '',
      orgName: orgName ?? '',
      role: role ?? 'viewer',
      isOwner: false,
      isAdmin: false,
      canEdit: false,
      approvalCategories: approvalCategories ?? ['talent'],
    }
  }

  return {
    orgId,
    orgName,
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    canEdit: role === 'owner' || role === 'admin' || role === 'contributor',
    approvalCategories,
  }
}

/**
 * Safe version that returns null instead of throwing.
 * Useful for conditional rendering.
 */
export function useOrgSafe(): UseOrgResult | null {
  const orgId = useOrgStore((state) => state.orgId)
  const orgName = useOrgStore((state) => state.orgName)
  const role = useOrgStore((state) => state.role)
  const approvalCategories = useOrgStore((state) => state.approvalCategories)
  const isHydrated = useOrgStore((state) => state.isHydrated)

  if (!isHydrated || !orgId || !orgName || !role) {
    return null
  }

  return {
    orgId,
    orgName,
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    canEdit: role === 'owner' || role === 'admin' || role === 'contributor',
    approvalCategories,
  }
}
