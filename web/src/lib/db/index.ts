// lib/db/index.ts
// Data access layer barrel export

// Client utilities
export {
  getUserMembership,
  requireOrgId,
  DbError,
  handleDbError,
  type SupabaseClient,
} from './client'

// Organizations
export {
  getOrganization,
  getOrganizationMembers,
  getUserOrganizations,
  createOrganization,
  updateOrganization,
  addOrganizationMember,
  updateMemberRole,
  removeOrganizationMember,
} from './organizations'
