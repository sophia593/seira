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
  }
}

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
    proofs: [],
  },
  {
    id: 'sample-del-004',
    title: 'Scoreboard Logo Display (All Innings)',
    category: 'in-venue',
    status: 'proved',
    due_date: '2025-06-14',
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
    proofs: [],
  },

  // ── Digital (4) ──
  {
    id: 'sample-del-006',
    title: 'Social Media Post — Pre-Event Announcement',
    category: 'digital',
    status: 'proved',
    due_date: '2025-06-07',
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
    proofs: [],
  },
  {
    id: 'sample-del-009',
    title: 'Website Homepage Banner Ad (30 days)',
    category: 'digital',
    status: 'proved',
    due_date: '2025-06-01',
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
    proofs: [],
  },
  {
    id: 'sample-del-012',
    title: 'Branded Hospitality Gift Bags',
    category: 'hospitality',
    status: 'in_progress',
    due_date: '2025-06-14',
    proofs: [],
  },

  // ── Signage (3) ──
  {
    id: 'sample-del-013',
    title: 'Main Gate Entrance Sign (8ft × 4ft)',
    category: 'signage',
    status: 'proved',
    due_date: '2025-06-12',
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
    proofs: [],
  },

  // ── Talent (2) ──
  {
    id: 'sample-del-016',
    title: 'Player Meet & Greet (Post-Game, 30 min)',
    category: 'talent',
    status: 'done',
    due_date: '2025-06-14',
    proofs: [],
  },
  {
    id: 'sample-del-017',
    title: 'Mascot Appearance at Partner Booth (3rd–5th Innings)',
    category: 'talent',
    status: 'proved',
    due_date: '2025-06-14',
    proofs: [
      makeProof('sample-del-017', 'Mascot at Booth', '#e11d48', '#fb7185', 0),
    ],
  },

  // ── Content (2) ──
  {
    id: 'sample-del-018',
    title: 'Branded Highlight Video (90-second cut)',
    category: 'content',
    status: 'in_progress',
    due_date: '2025-06-21',
    proofs: [],
  },
  {
    id: 'sample-del-019',
    title: 'Post-Event Photo Gallery (delivered via shared album)',
    category: 'content',
    status: 'not_started',
    due_date: '2025-06-28',
    proofs: [],
  },
]

// ---------------------------------------------------------------------------
// Stats (hand-calculated to match deliverables)
// ---------------------------------------------------------------------------

const stats: RecapData['stats'] = {
  total: 19,
  completed: 15, // done(6) + proved(9)
  proved: 9,
  inProgress: 3,
  byCategory: {
    'in-venue': { total: 5, completed: 4 },
    digital: { total: 4, completed: 4 },
    hospitality: { total: 3, completed: 2 },
    signage: { total: 3, completed: 3 },
    talent: { total: 2, completed: 2 },
    content: { total: 2, completed: 0 },
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
