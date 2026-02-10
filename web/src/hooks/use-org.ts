import { useOrgStore } from '@/stores/org-store'
import type { OrgRole } from '@/lib/types/database'

interface UseOrgResult {
  orgId: string
  orgName: string
  role: OrgRole
  isOwner: boolean
  isAdmin: boolean
}

/**
 * Hook to access organization context.
 * Throws if org context is not yet hydrated.
 */
export function useOrg(): UseOrgResult {
  const orgId = useOrgStore((state) => state.orgId)
  const orgName = useOrgStore((state) => state.orgName)
  const role = useOrgStore((state) => state.role)
  const isHydrated = useOrgStore((state) => state.isHydrated)

  if (!isHydrated || !orgId || !orgName || !role) {
    throw new Error('Organization context not available. Ensure useOrg is used within an authenticated route.')
  }

  return {
    orgId,
    orgName,
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
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
  }
}
