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

// Events
export {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from './events'

// Partners
export {
  listPartnersByEvent,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
} from './partners'

// Deliverables
export {
  listDeliverablesByPartner,
  listDeliverablesByEvent,
  getDeliverableById,
  createDeliverable,
  updateDeliverable,
  updateDeliverableStatus,
  deleteDeliverable,
} from './deliverables'

// Dashboard
export {
  getDashboardStats,
  getUpcomingEvents,
  getOverdueDeliverables,
  getNeedsProofDeliverables,
  type DashboardStats,
} from './dashboard'

// Proofs
export {
  listProofByDeliverable,
  listProofByPartner,
  countProofByDeliverable,
  createProofRecord,
  deleteProofRecord,
} from './proof'

// Templates
export {
  listTemplates,
  getTemplateById,
  listGlobalTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  type CreateTemplateInput,
} from './templates'
