// lib/types/database.ts
// Seira v1.1 — Core database types

export type OrgRole = 'owner' | 'admin' | 'contributor' | 'viewer';
export type EventStatus = 'upcoming' | 'active' | 'completed' | 'archived';
export type DeliverableStatus = 'not_started' | 'in_progress' | 'done' | 'pending_approval' | 'proved';
export type DeliverableCategory = 'in-venue' | 'digital' | 'hospitality' | 'signage' | 'talent' | 'content';
export type ProofRequired = 'photo' | 'link' | 'screenshot' | 'file' | 'multiple';
export type ProofType = 'photo' | 'video' | 'link' | 'file';
export type UsageScope = 'social' | 'broadcast' | 'all' | 'custom';
export type UsageTerritory = 'us' | 'global' | 'custom';
export type UsageDuration = '30d' | '90d' | '1yr' | 'perpetual' | 'custom';

export type OrgType = 'sports' | 'music' | 'festival' | 'conference' | 'university' | 'other';

export interface OrgSettings {
  approval_required_categories?: DeliverableCategory[];
  org_type?: OrgType;
  onboarding_completed?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  created_by: string;
  settings: OrgSettings;
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
  talent_sub_type: TalentType | null;
  talent_id: string | null;
  asset_id: string | null;
  notes: string | null;
  rejection_note: string | null;
  usage_scope: UsageScope | null;
  usage_territory: UsageTerritory | null;
  usage_duration: UsageDuration | null;
  usage_expiration_date: string | null;
  usage_scope_custom: string | null;
  usage_territory_custom: string | null;
  created_at: string;
  updated_at: string;
}

export type ProofValidationStatus = 'pending' | 'valid' | 'invalid' | 'skipped' | 'approved' | 'reupload_requested';

export interface ProofValidationResult {
  valid: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  issues: string[];
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
  validation_status: ProofValidationStatus | null;
  validation_result: ProofValidationResult | null;
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
  talent_sub_type?: TalentType;
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
  talent_sub_type?: TalentType;
  talent_id?: string;
  asset_id?: string;
  notes?: string;
  usage_scope?: UsageScope;
  usage_territory?: UsageTerritory;
  usage_duration?: UsageDuration;
  usage_expiration_date?: string;
  usage_scope_custom?: string;
  usage_territory_custom?: string;
}

export interface TalentCommitment {
  id: string;
  title: string;
  category: DeliverableCategory;
  status: DeliverableStatus;
  due_date: string | null;
  talent_sub_type: TalentType | null;
  event_id: string;
  event_name: string;
  partner_id: string;
  partner_name: string;
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
  | 'reupload_requested'
  | 'recap_published'
  | 'deliverable_completed'
  | 'member_joined'
  | 'role_changed'
  | 'member_removed'
  | 'pre_event_scan'
  | 'post_event_scan'
  | 'partner_health'
  | 'pending_approval'
  | 'deliverable_rejected'
  | 'usage_rights_expiring';

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
    usage_scope: string | null;
    usage_territory: string | null;
    usage_duration: string | null;
    usage_expiration_date: string | null;
    usage_scope_custom: string | null;
    usage_territory_custom: string | null;
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
      usage_scope: string | null;
      usage_territory: string | null;
      usage_duration: string | null;
      usage_expiration_date: string | null;
      usage_scope_custom: string | null;
      usage_territory_custom: string | null;
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

// === TALENT ===

export type TalentType = 'player' | 'artist' | 'influencer' | 'speaker';

export interface Talent {
  id: string;
  org_id: string;
  name: string;
  type: TalentType;
  affiliation: string | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTalentInput {
  name: string;
  type: TalentType;
  affiliation?: string;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
  photo_url?: string;
}

// === ASSETS ===

export interface Asset {
  id: string;
  org_id: string;
  name: string;
  capacity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetInput {
  name: string;
  capacity?: number | null;
  notes?: string;
}

export interface AssetUtilization {
  asset_id: string;
  asset_name: string;
  capacity: number | null;
  used: number;
  available: number | null;
  utilization_pct: number | null;
  partners: { id: string; name: string; count: number }[];
}

export interface SeasonAssetUtilization extends AssetUtilization {
  events_used_in: number;
  total_events: number;
}

export interface AssetUtilizationSummary {
  total_assets: number;
  avg_utilization_pct: number;
  at_capacity_count: number;
  underutilized_count: number;
  underutilized_assets: { name: string; utilization_pct: number; available: number }[];
}

// === WEBHOOKS ===

export type WebhookEventType =
  | 'recap_published'
  | 'deliverable_proved'
  | 'event_completed'
  | 'partner_added';

export interface Webhook {
  id: string;
  org_id: string;
  url: string;
  events: WebhookEventType[];
  active: boolean;
  signing_secret: string;
  description: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  org_id: string;
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  error: string | null;
  duration_ms: number | null;
  success: boolean;
  attempt_number: number;
  original_delivery_id: string | null;
  retries_exhausted: boolean;
  created_at: string;
}

// === API KEYS ===

export interface ApiKey {
  id: string;
  org_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyDisplay {
  id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

// === ACTIVITY LOG ===

export type ActivityAction =
  | 'created' | 'updated' | 'deleted' | 'duplicated'
  | 'status_changed' | 'uploaded_proof' | 'deleted_proof'
  | 'approved_proof' | 'requested_proof_reupload'
  | 'approved_deliverable' | 'rejected_deliverable'
  | 'published' | 'unpublished'
  | 'role_changed' | 'removed_member'
  | 'invited' | 'revoked_invite' | 'accepted_invite'
  | 'batch_created';

export type ActivityTargetType =
  | 'event' | 'partner' | 'deliverable' | 'proof'
  | 'season' | 'template' | 'recap' | 'member' | 'invite' | 'talent' | 'asset';

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
