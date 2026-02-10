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
  listPartners,
  getPartnerById,
  getPartnerWithCompletion,
  listPartnersWithCompletion,
  createPartner,
  updatePartner,
  deletePartner,
} from './partners'

// Deliverables
export {
  listDeliverables,
  getDeliverableById,
  getDeliverableWithPartner,
  listDeliverablesWithPartner,
  getOverdueDeliverables,
  getOrgOverdueDeliverables,
  createDeliverable,
  updateDeliverable,
  updateDeliverableStatus,
  deleteDeliverable,
  createDeliverablesFromTemplate,
} from './deliverables'

// Proofs
export {
  listProofs,
  getProofById,
  listProofsForEvent,
  countProofs,
  createProof,
  updateProof,
  deleteProof,
  deleteProofsForDeliverable,
  type CreateProofInput,
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
