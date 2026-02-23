import type { RecapData } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// SVG proof placeholder generator
// ---------------------------------------------------------------------------

function proofSvg(label: string, bg: string, fg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${bg}'/><stop offset='100%' stop-color='${fg}'/></linearGradient></defs><rect fill='url(%23g)' width='800' height='600' rx='8'/><text x='400' y='290' text-anchor='middle' fill='white' font-size='26' font-family='system-ui, sans-serif' opacity='0.7'>${label}</text><text x='400' y='330' text-anchor='middle' fill='white' font-size='16' font-family='system-ui, sans-serif' opacity='0.4'>proof of performance</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// ---------------------------------------------------------------------------
// Proof factory
// ---------------------------------------------------------------------------

let proofCounter = 0
function makeProof(
  deliverableId: string,
  label: string,
  bg: string,
  fg: string,
  daysAgo: number,
) {
  proofCounter++
  const id = `sample-proof-${String(proofCounter).padStart(3, '0')}`
  const date = new Date(2025, 5, 14 - daysAgo) // relative to June 14, 2025
  return {
    id,
    deliverable_id: deliverableId,
    org_id: 'sample-org-001',
    file_url: proofSvg(label, bg, fg),
    file_name: `${label.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    file_type: 'image/svg+xml',
    file_size: 2_400_000,
    uploaded_by: 'sample-user-001',
    created_at: date.toISOString(),
    uploader_name: 'Alex Rivera',
    validation_status: 'valid' as const,
    validation_result: { valid: true, confidence: 'high' as const, reason: 'Proof matches deliverable', issues: [] },
  }
}

// ---------------------------------------------------------------------------
// Usage rights defaults (non-talent)
// ---------------------------------------------------------------------------

const noUsage = {
  usage_scope: null,
  usage_territory: null,
  usage_duration: null,
  usage_expiration_date: null,
  usage_scope_custom: null,
  usage_territory_custom: null,
} as const

// ---------------------------------------------------------------------------
// Deliverables
// ---------------------------------------------------------------------------

const deliverables: RecapData['deliverables'] = [
  // ── In-Venue (5) ──
  {
    id: 'sample-del-001',
    title: 'LED Board Rotation (30-second spot, 4× per game)',
    category: 'in-venue',
    status: 'proved',
    due_date: '2025-06-14',
    ...noUsage,
    proofs: [
      makeProof('sample-del-001', 'LED Board — Game Day', '#6d28d9', '#a78bfa', 0),
      makeProof('sample-del-001', 'LED Board — Close-Up', '#7c3aed', '#c4b5fd', 0),
    ],
  },
  {
    id: 'sample-del-002',
    title: 'Concourse Banner (Section 100 Main Entrance)',
    category: 'in-venue',
    status: 'proved',
    due_date: '2025-06-10',
    ...noUsage,
    proofs: [
      makeProof('sample-del-002', 'Concourse Banner', '#6d28d9', '#8b5cf6', 4),
    ],
  },
  {
    id: 'sample-del-003',
    title: 'PA Announcement (2nd & 5th Innings)',
    category: 'in-venue',
    status: 'done',
    due_date: '2025-06-14',
    ...noUsage,
    proofs: [],
  },
  {
    id: 'sample-del-004',
    title: 'Scoreboard Logo Display (All Innings)',
    category: 'in-venue',
    status: 'proved',
    due_date: '2025-06-14',
    ...noUsage,
    proofs: [
      makeProof('sample-del-004', 'Scoreboard Logo', '#7c3aed', '#a78bfa', 0),
    ],
  },
  {
    id: 'sample-del-005',
    title: 'First Pitch Ceremony Branding',
    category: 'in-venue',
    status: 'in_progress',
    due_date: '2025-06-14',
    ...noUsage,
    proofs: [],
  },

  // ── Digital (4) ──
  {
    id: 'sample-del-006',
    title: 'Social Media Post — Pre-Event Announcement',
    category: 'digital',
    status: 'proved',
    due_date: '2025-06-07',
    ...noUsage,
    proofs: [
      makeProof('sample-del-006', 'Instagram Post', '#2563eb', '#60a5fa', 7),
    ],
  },
  {
    id: 'sample-del-007',
    title: 'Social Media Post — Game Day Recap',
    category: 'digital',
    status: 'proved',
    due_date: '2025-06-15',
    ...noUsage,
    proofs: [
      makeProof('sample-del-007', 'Game Day Story', '#2563eb', '#93c5fd', 0),
      makeProof('sample-del-007', 'Carousel Post', '#1d4ed8', '#60a5fa', 0),
    ],
  },
  {
    id: 'sample-del-008',
    title: 'Email Newsletter Feature (50K subscriber list)',
    category: 'digital',
    status: 'done',
    due_date: '2025-06-10',
    ...noUsage,
    proofs: [],
  },
  {
    id: 'sample-del-009',
    title: 'Website Homepage Banner Ad (30 days)',
    category: 'digital',
    status: 'proved',
    due_date: '2025-06-01',
    ...noUsage,
    proofs: [
      makeProof('sample-del-009', 'Website Banner', '#1d4ed8', '#3b82f6', 13),
    ],
  },

  // ── Hospitality (3) ──
  {
    id: 'sample-del-010',
    title: 'Premium Suite Access (12 Guests)',
    category: 'hospitality',
    status: 'proved',
    due_date: '2025-06-14',
    ...noUsage,
    proofs: [
      makeProof('sample-del-010', 'Suite Setup', '#d97706', '#fbbf24', 0),
      makeProof('sample-del-010', 'Guests in Suite', '#b45309', '#f59e0b', 0),
    ],
  },
  {
    id: 'sample-del-011',
    title: 'Pre-Game VIP Reception',
    category: 'hospitality',
    status: 'done',
    due_date: '2025-06-14',
    ...noUsage,
    proofs: [],
  },
  {
    id: 'sample-del-012',
    title: 'Branded Hospitality Gift Bags',
    category: 'hospitality',
    status: 'in_progress',
    due_date: '2025-06-14',
    ...noUsage,
    proofs: [],
  },

  // ── Signage (3) ──
  {
    id: 'sample-del-013',
    title: 'Main Gate Entrance Sign (8ft × 4ft)',
    category: 'signage',
    status: 'proved',
    due_date: '2025-06-12',
    ...noUsage,
    proofs: [
      makeProof('sample-del-013', 'Main Gate Sign', '#059669', '#34d399', 2),
    ],
  },
  {
    id: 'sample-del-014',
    title: 'Outfield Wall Panel (Left Field)',
    category: 'signage',
    status: 'proved',
    due_date: '2025-06-12',
    ...noUsage,
    proofs: [
      makeProof('sample-del-014', 'Outfield Wall', '#047857', '#6ee7b7', 2),
    ],
  },
  {
    id: 'sample-del-015',
    title: 'Parking Lot Directional Signs (×4)',
    category: 'signage',
    status: 'done',
    due_date: '2025-06-10',
    ...noUsage,
    proofs: [],
  },

  // ── Talent (8) ──
  // Player autograph session — social only, US, 30 days
  {
    id: 'sample-del-016',
    title: 'Marcus Rivera (#24) — Autograph Signing Session',
    category: 'talent',
    status: 'proved',
    due_date: '2025-06-14',
    usage_scope: 'social',
    usage_territory: 'us',
    usage_duration: '30d',
    usage_expiration_date: '2025-07-14',
    usage_scope_custom: null,
    usage_territory_custom: null,
    proofs: [
      makeProof('sample-del-016', 'Autograph Session — Wide', '#e11d48', '#fb7185', 0),
      makeProof('sample-del-016', 'Fan with Signed Ball', '#be123c', '#f43f5e', 0),
    ],
  },
  // Player meet & greet — all media, global, 1 year
  {
    id: 'sample-del-017',
    title: 'Marcus Rivera (#24) — Post-Game Meet & Greet (30 min)',
    category: 'talent',
    status: 'proved',
    due_date: '2025-06-14',
    usage_scope: 'all',
    usage_territory: 'global',
    usage_duration: '1yr',
    usage_expiration_date: '2026-06-14',
    usage_scope_custom: null,
    usage_territory_custom: null,
    proofs: [
      makeProof('sample-del-017', 'Meet & Greet — Group', '#e11d48', '#fb7185', 0),
    ],
  },
  // Player social media takeover — social only, US, 90 days
  {
    id: 'sample-del-018',
    title: 'Marcus Rivera (#24) — Instagram Takeover (Game Day)',
    category: 'talent',
    status: 'proved',
    due_date: '2025-06-14',
    usage_scope: 'social',
    usage_territory: 'us',
    usage_duration: '90d',
    usage_expiration_date: '2025-09-12',
    usage_scope_custom: null,
    usage_territory_custom: null,
    proofs: [
      makeProof('sample-del-018', 'IG Takeover — BTS', '#9f1239', '#e11d48', 0),
      makeProof('sample-del-018', 'IG Takeover — Tunnel Walk', '#881337', '#be123c', 0),
    ],
  },
  // Player video testimonial — broadcast, US, perpetual
  {
    id: 'sample-del-019',
    title: 'Marcus Rivera (#24) — 60-Second Video Testimonial',
    category: 'talent',
    status: 'done',
    due_date: '2025-06-21',
    usage_scope: 'broadcast',
    usage_territory: 'us',
    usage_duration: 'perpetual',
    usage_expiration_date: null,
    usage_scope_custom: null,
    usage_territory_custom: null,
    proofs: [],
  },
  // Mascot appearance — all media, global, perpetual
  {
    id: 'sample-del-020',
    title: 'Blaze the Bear — Partner Booth Appearance (3rd–5th Innings)',
    category: 'talent',
    status: 'proved',
    due_date: '2025-06-14',
    usage_scope: 'all',
    usage_territory: 'global',
    usage_duration: 'perpetual',
    usage_expiration_date: null,
    usage_scope_custom: null,
    usage_territory_custom: null,
    proofs: [
      makeProof('sample-del-020', 'Mascot at Booth', '#e11d48', '#fb7185', 0),
      makeProof('sample-del-020', 'Mascot with Fans', '#be123c', '#f43f5e', 0),
    ],
  },
  // Player branded photo shoot — custom scope/territory
  {
    id: 'sample-del-021',
    title: 'Elena Torres (#7) — Branded Photo Shoot (Pre-Game)',
    category: 'talent',
    status: 'proved',
    due_date: '2025-06-14',
    usage_scope: 'custom',
    usage_territory: 'custom',
    usage_duration: '1yr',
    usage_expiration_date: '2026-06-14',
    usage_scope_custom: 'Social, Web, Print (excl. OOH)',
    usage_territory_custom: 'North America (US, CA, MX)',
    proofs: [
      makeProof('sample-del-021', 'Photo Shoot — Dugout', '#7c2d12', '#ea580c', 0),
      makeProof('sample-del-021', 'Photo Shoot — Hero Shot', '#9a3412', '#f97316', 0),
      makeProof('sample-del-021', 'Photo Shoot — With Product', '#c2410c', '#fb923c', 0),
    ],
  },
  // Coach halftime interview — broadcast, US, 90 days
  {
    id: 'sample-del-022',
    title: 'Coach Williams — Halftime Interview Mention',
    category: 'talent',
    status: 'done',
    due_date: '2025-06-14',
    usage_scope: 'broadcast',
    usage_territory: 'us',
    usage_duration: '90d',
    usage_expiration_date: '2025-09-12',
    usage_scope_custom: null,
    usage_territory_custom: null,
    proofs: [],
  },
  // Player gifting unboxing — social, global, 30 days
  {
    id: 'sample-del-023',
    title: 'Marcus Rivera (#24) — Product Unboxing Video (TikTok)',
    category: 'talent',
    status: 'in_progress',
    due_date: '2025-06-21',
    usage_scope: 'social',
    usage_territory: 'global',
    usage_duration: '30d',
    usage_expiration_date: '2025-07-14',
    usage_scope_custom: null,
    usage_territory_custom: null,
    proofs: [],
  },

  // ── Content (3) ──
  {
    id: 'sample-del-024',
    title: 'Branded Highlight Video (90-second cut)',
    category: 'content',
    status: 'in_progress',
    due_date: '2025-06-21',
    ...noUsage,
    proofs: [],
  },
  {
    id: 'sample-del-025',
    title: 'Post-Event Photo Gallery (delivered via shared album)',
    category: 'content',
    status: 'not_started',
    due_date: '2025-06-28',
    ...noUsage,
    proofs: [],
  },
  {
    id: 'sample-del-026',
    title: 'Sponsor Sizzle Reel (2-min recap for partner)',
    category: 'content',
    status: 'not_started',
    due_date: '2025-07-05',
    ...noUsage,
    proofs: [],
  },
]

// ---------------------------------------------------------------------------
// Stats (hand-calculated to match deliverables)
// ---------------------------------------------------------------------------

const stats: RecapData['stats'] = {
  total: 26,
  completed: 20, // done(6) + proved(14)
  proved: 14,
  inProgress: 4,
  byCategory: {
    'in-venue': { total: 5, completed: 4 },
    digital: { total: 4, completed: 4 },
    hospitality: { total: 3, completed: 2 },
    signage: { total: 3, completed: 3 },
    talent: { total: 8, completed: 7 },
    content: { total: 3, completed: 0 },
  },
}

// ---------------------------------------------------------------------------
// Full sample data export
// ---------------------------------------------------------------------------

export const SAMPLE_RECAP_DATA: RecapData = {
  recap: {
    id: 'sample-recap-001',
    org_id: 'sample-org-001',
    event_id: 'sample-event-001',
    partner_id: 'sample-partner-001',
    share_token: 'sample',
    title: 'Metro National Insurance — 2025 Summer Classic Recap',
    status: 'published',
    cover_note:
      "Thank you for your continued partnership with Pacific Sports Group. This recap summarizes all sponsorship deliverables fulfilled during the 2025 Summer Classic. We're proud of the visibility and engagement your brand received throughout the event.",
    generated_by: 'sample-user-001',
    published_at: '2025-06-16T10:00:00Z',
    season_id: null,
    partner_name: null,
    is_combined: false,
    created_at: '2025-06-15T14:00:00Z',
    updated_at: '2025-06-16T10:00:00Z',
  },
  organization: { name: 'Pacific Sports Group' },
  event: {
    name: '2025 Summer Classic',
    date: '2025-06-14',
    venue: 'Meridian Park Stadium',
  },
  partner: {
    name: 'Metro National Insurance',
    contact_name: 'Sarah Chen, VP Partnerships',
    contact_email: 'sarah.chen@example.com',
  },
  deliverables,
  stats,
}
