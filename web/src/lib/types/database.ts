// lib/types/database.ts
// Seira v1.1 — Core database types

export type OrgRole = 'owner' | 'admin' | 'contributor' | 'viewer';
export type EventStatus = 'upcoming' | 'active' | 'completed' | 'archived';
export type DeliverableStatus = 'not_started' | 'in_progress' | 'done' | 'proved';
export type DeliverableCategory = 'in-venue' | 'digital' | 'hospitality' | 'signage' | 'talent' | 'content';
export type ProofRequired = 'photo' | 'link' | 'screenshot' | 'file' | 'multiple';
export type ProofType = 'photo' | 'video' | 'link' | 'file';

export interface Organization {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  user_id: string;
  org_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Event {
  id: string;
  org_id: string;
  name: string;
  date: string | null;
  venue: string | null;
  status: EventStatus;
  notes: string | null;
  season_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  org_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonInput {
  name: string;
  start_date?: string;
  end_date?: string;
}

export interface SeasonWithStats extends Season {
  event_count: number;
  total_deliverables: number;
  completed_deliverables: number;
  completion_pct: number;
}

export interface SeasonPartnerRollup {
  name: string;
  event_count: number;
  events: { id: string; name: string }[];
  total_deliverables: number;
  completed_deliverables: number;
  proved_deliverables: number;
  overdue_count: number;
  completion_pct: number;
}

export interface OrgPartnerRollup {
  name: string;
  event_count: number;
  events: { id: string; name: string }[];
  total_deliverables: number;
  completed_deliverables: number;
  proved_deliverables: number;
  overdue_count: number;
  completion_pct: number;
  contact_name: string | null;
  contact_email: string | null;
  total_deal_value: number;
  deal_summaries: { event_name: string; event_id: string; notes: string }[];
  per_event_stats: {
    event_id: string;
    partner_id: string;
    event_name: string;
    total: number;
    completed: number;
    completion_pct: number;
  }[];
  next_renewal_date: string | null;
  last_recap: {
    id: string;
    status: 'draft' | 'published';
    date: string;
    event_id: string;
    share_token: string;
  } | null;
}

export interface Partner {
  id: string;
  org_id: string;
  event_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contract_notes: string | null;
  deal_value: number | null;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  partner_id: string;
  event_id: string;
  title: string;
  category: DeliverableCategory;
  due_date: string | null;
  owner_id: string | null;
  status: DeliverableStatus;
  proof_required: ProofRequired;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Proof {
  id: string;
  deliverable_id: string;
  org_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface Template {
  id: string;
  org_id: string | null;
  name: string;
  industry: string | null;
  deliverables: TemplateDeliverable[];
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateDeliverable {
  title: string;
  category: DeliverableCategory;
  proof_required: ProofRequired;
  notes?: string;
}

// === JOIN / VIEW TYPES ===

export interface PartnerWithCompletion extends Partner {
  total_deliverables: number;
  completed_deliverables: number;
  completion_pct: number;
}

export interface EventWithCompletion extends Event {
  total_deliverables: number;
  completed_deliverables: number;
  overdue_count: number;
  completion_pct: number;
  needs_proof_count?: number;
}

export interface DeliverableWithPartner extends Deliverable {
  partner: Pick<Partner, 'id' | 'name'>;
}

export interface ProofWithDeliverable extends Proof {
  deliverable: Pick<Deliverable, 'id' | 'title' | 'partner_id' | 'event_id'>;
}

// === FORM TYPES ===

export interface CreateEventInput {
  name: string;
  date?: string;
  venue?: string;
  status?: EventStatus;
  notes?: string;
  season_id?: string | null;
}

export interface CreatePartnerInput {
  event_id: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contract_notes?: string;
  deal_value?: number;
  renewal_date?: string;
}

export interface CreateDeliverableInput {
  partner_id: string;
  event_id: string;
  title: string;
  category: DeliverableCategory;
  due_date?: string;
  owner_id?: string;
  status?: DeliverableStatus;
  proof_required?: ProofRequired;
  notes?: string;
}

export interface CreateProofRecordInput {
  deliverable_id: string;
  org_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
}

// === INVITATIONS ===

export type InviteStatus = 'pending' | 'accepted' | 'revoked';

export interface Invitation {
  id: string;
  org_id: string;
  invite_code: string;
  role: OrgRole;
  created_by: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  status: InviteStatus;
  created_at: string;
}

// === NOTIFICATIONS ===

export type NotificationType =
  | 'invite_accepted'
  | 'proof_uploaded'
  | 'recap_published'
  | 'deliverable_completed'
  | 'member_joined'
  | 'role_changed'
  | 'member_removed'
  | 'pre_event_scan'
  | 'post_event_scan'
  | 'partner_health';

export interface AppNotification {
  id: string;
  user_id: string;
  org_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// === RECAP REPORTS ===

export type RecapStatus = 'draft' | 'published' | 'archived';

export interface RecapReport {
  id: string;
  org_id: string;
  event_id: string;
  partner_id: string;
  share_token: string;
  title: string;
  status: RecapStatus;
  cover_note: string | null;
  generated_by: string;
  published_at: string | null;
  season_id: string | null;
  partner_name: string | null;
  is_combined: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecapData {
  recap: RecapReport;
  organization: { name: string };
  event: { name: string; date: string | null; venue: string | null };
  partner: { name: string; contact_name: string | null; contact_email: string | null };
  deliverables: Array<{
    id: string;
    title: string;
    category: DeliverableCategory;
    status: DeliverableStatus;
    due_date: string | null;
    proofs: (Proof & { uploader_name: string | null })[];
  }>;
  stats: {
    total: number;
    completed: number;
    proved: number;
    inProgress: number;
    byCategory: Record<string, { total: number; completed: number }>;
  };
}

export interface SeasonRecapData {
  recap: RecapReport;
  organization: { name: string };
  season: { name: string; start_date: string | null; end_date: string | null };
  partner: { name: string; contact_name: string | null; contact_email: string | null };
  events: Array<{
    id: string;
    name: string;
    date: string | null;
    venue: string | null;
    deliverables: Array<{
      id: string;
      title: string;
      category: DeliverableCategory;
      status: DeliverableStatus;
      due_date: string | null;
      proofs: (Proof & { uploader_name: string | null })[];
    }>;
  }>;
  deliverables: RecapData['deliverables'];
  stats: RecapData['stats'];
}

export interface CombinedRecapData {
  recap: RecapReport;
  organization: { name: string };
  partner: { name: string; contact_name: string | null; contact_email: string | null };
  eventCount: number;
  totalDealValue: number;
  dateRange: { earliest: string | null; latest: string | null };
  events: SeasonRecapData['events'];
  deliverables: RecapData['deliverables'];
  stats: RecapData['stats'];
}

// === ACTIVITY LOG ===

export type ActivityAction =
  | 'created' | 'updated' | 'deleted' | 'duplicated'
  | 'status_changed' | 'uploaded_proof' | 'deleted_proof'
  | 'published' | 'unpublished'
  | 'role_changed' | 'removed_member'
  | 'invited' | 'revoked_invite' | 'accepted_invite'
  | 'batch_created';

export type ActivityTargetType =
  | 'event' | 'partner' | 'deliverable' | 'proof'
  | 'season' | 'template' | 'recap' | 'member' | 'invite';

export interface ActivityLog {
  id: string;
  org_id: string;
  event_id: string | null;
  user_id: string;
  action: ActivityAction;
  target_type: ActivityTargetType;
  target_id: string | null;
  details_json: Record<string, unknown>;
  created_at: string;
}
