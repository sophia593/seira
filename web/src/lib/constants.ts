// lib/constants.ts
// Seira v1.1 — UI constants, labels, helpers

import type {
  DeliverableCategory,
  DeliverableStatus,
  EventStatus,
  ProofRequired,
  ProofType,
  TalentType,
  UsageScope,
  UsageTerritory,
  UsageDuration,
} from './types/database';

// ============================================
// DELIVERABLE CATEGORIES
// ============================================

export const CATEGORY_CONFIG: Record<
  DeliverableCategory,
  {
    label: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    sortOrder: number;
  }
> = {
  'in-venue': {
    label: 'In-Venue',
    description: 'LED boards, jumbotron, PA announcements, activations',
    icon: '🏟️',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    sortOrder: 1,
  },
  digital: {
    label: 'Digital',
    description: 'Social media posts, email blasts, website placements',
    icon: '📱',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    sortOrder: 2,
  },
  hospitality: {
    label: 'Hospitality',
    description: 'Suite access, VIP passes, meet & greets, catering',
    icon: '🎟️',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    sortOrder: 3,
  },
  signage: {
    label: 'Signage',
    description: 'Banners, concourse displays, lobby screens, wraps',
    icon: '🪧',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
    sortOrder: 4,
  },
  talent: {
    label: 'Talent',
    description: 'First pitch, halftime appearance, anthem, MC mentions',
    icon: '🎤',
    color: 'text-rose-700',
    bgColor: 'bg-rose-100',
    borderColor: 'border-rose-200',
    sortOrder: 5,
  },
  content: {
    label: 'Content',
    description: 'Program ads, video features, branded content, newsletters',
    icon: '📝',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-200',
    sortOrder: 6,
  },
};

export const CATEGORIES = (Object.keys(CATEGORY_CONFIG) as DeliverableCategory[]).sort(
  (a, b) => CATEGORY_CONFIG[a].sortOrder - CATEGORY_CONFIG[b].sortOrder
);

// ============================================
// TALENT TYPES
// ============================================

export const TALENT_TYPE_CONFIG: Record<
  TalentType,
  { label: string; icon: string; color: string; bgColor: string; borderColor: string }
> = {
  player:     { label: 'Player',     icon: '🏀', color: 'text-blue-700',   bgColor: 'bg-blue-50',   borderColor: 'border-blue-200' },
  artist:     { label: 'Artist',     icon: '🎤', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  influencer: { label: 'Influencer', icon: '📱', color: 'text-pink-700',   bgColor: 'bg-pink-50',   borderColor: 'border-pink-200' },
  speaker:    { label: 'Speaker',    icon: '🎙️', color: 'text-amber-700',  bgColor: 'bg-amber-50',  borderColor: 'border-amber-200' },
};

export const TALENT_TYPES = Object.keys(TALENT_TYPE_CONFIG) as TalentType[];

// ============================================
// USAGE RIGHTS
// ============================================

export const USAGE_SCOPE_OPTIONS: { value: UsageScope; label: string }[] = [
  { value: 'social', label: 'Social Media' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'all', label: 'All Media' },
  { value: 'custom', label: 'Custom' },
];

export const USAGE_TERRITORY_OPTIONS: { value: UsageTerritory; label: string }[] = [
  { value: 'us', label: 'United States' },
  { value: 'global', label: 'Global' },
  { value: 'custom', label: 'Custom' },
];

export const USAGE_DURATION_OPTIONS: { value: UsageDuration; label: string }[] = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1yr', label: '1 Year' },
  { value: 'perpetual', label: 'Perpetual' },
  { value: 'custom', label: 'Custom' },
];

export const USAGE_SCOPES = USAGE_SCOPE_OPTIONS.map((o) => o.value) as UsageScope[];
export const USAGE_TERRITORIES = USAGE_TERRITORY_OPTIONS.map((o) => o.value) as UsageTerritory[];
export const USAGE_DURATIONS = USAGE_DURATION_OPTIONS.map((o) => o.value) as UsageDuration[];

/** Compute expiration date from event date + duration preset. */
export function computeExpirationDate(eventDate: string, duration: UsageDuration): string | null {
  if (duration === 'perpetual' || duration === 'custom') return null;
  const d = new Date(eventDate);
  if (duration === '30d') d.setDate(d.getDate() + 30);
  else if (duration === '90d') d.setDate(d.getDate() + 90);
  else if (duration === '1yr') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Build a natural-language usage rights sentence for recap display. */
export function buildUsageRightsSentence(
  scope: string | null,
  territory: string | null,
  duration: string | null,
  expirationDate: string | null,
  scopeCustom: string | null,
  territoryCustom: string | null,
): string | null {
  if (!scope) return null;
  const parts: string[] = ['Content may be used'];
  // scope
  const scopeLabel =
    scope === 'custom'
      ? scopeCustom || 'custom usage'
      : USAGE_SCOPE_OPTIONS.find((o) => o.value === scope)?.label.toLowerCase() ?? scope;
  parts.push(`for ${scopeLabel}`);
  // territory
  if (territory) {
    const tLabel =
      territory === 'custom'
        ? territoryCustom || 'custom territory'
        : territory === 'us'
          ? 'US'
          : USAGE_TERRITORY_OPTIONS.find((o) => o.value === territory)?.label ?? territory;
    parts.push(`${tLabel} only`);
  }
  // expiration
  if (expirationDate) {
    const expLabel = new Date(expirationDate).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    parts.push(`through ${expLabel}`);
  } else if (duration === 'perpetual') {
    parts.push('in perpetuity');
  }
  return parts.join(', ') + '.';
}

// ============================================
// DELIVERABLE STATUSES
// ============================================

export const STATUS_CONFIG: Record<
  DeliverableStatus,
  {
    label: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    dotColor: string;
    borderColor: string;
    sortOrder: number;
  }
> = {
  not_started: {
    label: 'Not Started',
    description: 'Deliverable created but no work begun',
    icon: '⏳',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    dotColor: 'bg-gray-400',
    borderColor: 'border-gray-200',
    sortOrder: 1,
  },
  in_progress: {
    label: 'In Progress',
    description: 'Actively being worked on',
    icon: '🔄',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    dotColor: 'bg-meadow',
    borderColor: 'border-blue-200',
    sortOrder: 2,
  },
  done: {
    label: 'Done',
    description: 'Completed — awaiting proof if required',
    icon: '✅',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    dotColor: 'bg-copper',
    borderColor: 'border-green-200',
    sortOrder: 3,
  },
  pending_approval: {
    label: 'Pending Approval',
    description: 'Proof uploaded — awaiting admin approval',
    icon: '👁️',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    dotColor: 'bg-orange-400',
    borderColor: 'border-orange-200',
    sortOrder: 4,
  },
  proved: {
    label: 'Proved',
    description: 'Completed with proof attached — ready for recap',
    icon: '🏆',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    dotColor: 'bg-yellow-500',
    borderColor: 'border-yellow-200',
    sortOrder: 5,
  },
};

export const STATUS_FLOW: DeliverableStatus[] = ['not_started', 'in_progress', 'done', 'pending_approval', 'proved'];

// ============================================
// EVENT STATUSES
// ============================================

export const EVENT_STATUS_CONFIG: Record<
  EventStatus,
  {
    label: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    sortOrder: number;
  }
> = {
  upcoming: {
    label: 'Upcoming',
    description: 'Scheduled — deliverables being prepared',
    icon: '📅',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    sortOrder: 1,
  },
  active: {
    label: 'Active',
    description: 'Event day — deliverables being fulfilled live',
    icon: '🔴',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    sortOrder: 2,
  },
  completed: {
    label: 'Completed',
    description: 'Event over — collecting proof and building recaps',
    icon: '✅',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    sortOrder: 3,
  },
  archived: {
    label: 'Archived',
    description: 'Fully recapped and closed out',
    icon: '📦',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    sortOrder: 4,
  },
};

export const EVENT_STATUS_FLOW: EventStatus[] = ['upcoming', 'active', 'completed', 'archived'];

export const EVENT_DOT_COLOR: Record<EventStatus, string> = {
  upcoming: 'bg-copper',
  active: 'bg-green-500',
  completed: 'bg-gray-400',
  archived: 'bg-gray-500',
};

// ============================================
// PROOF REQUIRED TYPES
// ============================================

export const PROOF_REQUIRED_CONFIG: Record<
  ProofRequired,
  { label: string; description: string; icon: string }
> = {
  photo:      { label: 'Photo',      description: 'Photo of the deliverable in action',        icon: '📷' },
  link:       { label: 'Link',       description: 'URL to live post, article, or page',        icon: '🔗' },
  screenshot: { label: 'Screenshot', description: 'Screenshot of digital deliverable',         icon: '🖥️' },
  file:       { label: 'File',       description: 'Document, PDF, or other file upload',       icon: '📄' },
  multiple:   { label: 'Multiple',   description: 'Multiple proof items (photos, links, etc)', icon: '📦' },
};

export const PROOF_REQUIRED_OPTIONS = Object.keys(PROOF_REQUIRED_CONFIG) as ProofRequired[];

// ============================================
// PROOF TYPES (what gets uploaded)
// ============================================

export const PROOF_TYPE_CONFIG: Record<
  ProofType,
  { label: string; icon: string; accept?: string }
> = {
  photo: { label: 'Photo', icon: '📷', accept: 'image/*' },
  video: { label: 'Video', icon: '🎥', accept: 'video/*' },
  link:  { label: 'Link',  icon: '🔗' },
  file:  { label: 'File',  icon: '📄', accept: '*/*' },
};

// ============================================
// HELPERS
// ============================================

/** Get the next status in the flow, or null if at the end */
export function getNextStatus(current: DeliverableStatus): DeliverableStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

/** Get the previous status in the flow, or null if at the start */
export function getPrevStatus(current: DeliverableStatus): DeliverableStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  return idx > 0 ? STATUS_FLOW[idx - 1] : null;
}

/** Get the next event status in the flow, or null if at the end */
export function getNextEventStatus(current: EventStatus): EventStatus | null {
  const idx = EVENT_STATUS_FLOW.indexOf(current);
  return idx < EVENT_STATUS_FLOW.length - 1 ? EVENT_STATUS_FLOW[idx + 1] : null;
}

/** Check if a deliverable is overdue */
export function isOverdue(status: DeliverableStatus, dueDate: string | null): boolean {
  if (!dueDate) return false;
  if (status === 'done' || status === 'pending_approval' || status === 'proved') return false;
  return new Date(dueDate) < new Date(new Date().toDateString()); // compare date only
}

/** Check if a deliverable needs proof (done but not yet proved, and proof is required) */
export function needsProof(status: DeliverableStatus, proofRequired: ProofRequired | null): boolean {
  return status === 'done' && proofRequired !== null;
}

/** Check if a deliverable is in a completed state (done, pending approval, or proved) */
export function isDeliverableCompleted(status: DeliverableStatus): boolean {
  return status === 'done' || status === 'pending_approval' || status === 'proved';
}

/** Format a date for display — "Sat, Mar 15, 2026" */
export function formatEventDate(date: string | null): string {
  if (!date) return 'No date set';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format a short date — "Mar 15" */
export function formatShortDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Calculate completion percentage */
export function completionPct(total: number, completed: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// ============================================
// DASHBOARD ATTENTION SECTIONS
// ============================================

export const ATTENTION_CONFIG = {
  overdue:          { label: 'Overdue',           headerColor: 'text-red-500',    dotColor: 'bg-red-500',    accentColor: 'text-red-500' },
  pending_approval: { label: 'Awaiting Approval', headerColor: 'text-orange-500', dotColor: 'bg-orange-400', accentColor: 'text-orange-500' },
  needs_proof:      { label: 'Needs Proof',       headerColor: 'text-amber-500',  dotColor: 'bg-amber-400',  accentColor: 'text-amber-500' },
  renewal:          { label: 'Upcoming Renewals',  headerColor: 'text-blue-500',   dotColor: 'bg-blue-400',   accentColor: 'text-blue-500' },
} as const;

// ============================================
// RECAP STATUS
// ============================================

export const RECAP_STATUS_CONFIG = {
  published: { label: 'Published', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  draft:     { label: 'Draft',     color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
} as const;

// ============================================
// BILLING STATUS
// ============================================

export const BILLING_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  trialing: { label: 'Trial',    color: 'text-amber-700',   bgColor: 'bg-amber-100' },
  active:   { label: 'Active',   color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  past_due: { label: 'Past Due', color: 'text-red-700',     bgColor: 'bg-red-100' },
  canceled: { label: 'Canceled', color: 'text-gray-600',    bgColor: 'bg-gray-100' },
  none:     { label: 'No Plan',  color: 'text-gray-600',    bgColor: 'bg-gray-100' },
};

// ============================================
// CONNECTION / INTEGRATION STATUS
// ============================================

export const CONNECTION_STATUS_CONFIG = {
  connected: { label: 'Connected', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  paused:    { label: 'Paused',    color: 'text-gray-500',    bgColor: 'bg-gray-50',    borderColor: 'border-gray-200' },
} as const;

// ============================================
// APP-WIDE DEFAULTS
// ============================================

export const APP_NAME = 'Seira';
export const APP_DESCRIPTION = 'Partner deliverables & fulfillment management';
export const DEFAULT_EVENT_STATUS: EventStatus = 'upcoming';
export const DEFAULT_DELIVERABLE_STATUS: DeliverableStatus = 'not_started';
export const DEFAULT_PROOF_REQUIRED: ProofRequired = 'photo';

// ============================================
// DEFAULT ASSETS
// ============================================

export const DEFAULT_ASSETS: { name: string; capacity: number | null }[] = [
  { name: 'LED Ribbon',      capacity: 4 },
  { name: 'PA Announcement', capacity: 6 },
  { name: 'Suite',           capacity: 2 },
  { name: 'Banner',          capacity: 1 },
  { name: 'Social Post',     capacity: null },
];
