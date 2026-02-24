'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { canManageContent } from '@/lib/permissions'
import { logActivity } from '@/lib/db/activity-log'
import type { OrgRole, DeliverableCategory, DeliverableStatus, EventStatus } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EVENTS: { name: string; status: EventStatus; daysFromNow: number; venue: string }[] = [
  { name: 'Summer Music Festival', status: 'completed', daysFromNow: -30, venue: 'Central Park Amphitheater' },
  { name: 'Tech Conference 2025', status: 'active', daysFromNow: 7, venue: 'Convention Center Hall A' },
  { name: 'Fall Product Launch', status: 'upcoming', daysFromNow: 45, venue: 'Grand Ballroom' },
]

const PARTNER_NAMES = [
  'Acme Corp', 'GlobalTech', 'Bright Media', 'Pinnacle Sports',
  'Summit Health', 'Nova Energy', 'Blue Ocean Co', 'RedLine Auto',
  'Zenith Finance', 'Atlas Logistics', 'Evergreen Foods', 'Pulse Fitness',
]

const CATEGORIES: DeliverableCategory[] = ['signage', 'digital', 'hospitality', 'in-venue', 'talent', 'content']

const STATUSES_BY_EVENT: Record<EventStatus, DeliverableStatus[]> = {
  completed: ['done', 'proved', 'proved', 'done', 'proved', 'done'],
  active: ['in_progress', 'done', 'not_started', 'in_progress', 'done', 'not_started'],
  upcoming: ['not_started', 'not_started', 'not_started', 'in_progress', 'not_started', 'not_started'],
  archived: ['done', 'done', 'done', 'done', 'done', 'done'],
}

const DELIVERABLE_TITLES: Record<DeliverableCategory, string[]> = {
  'signage': ['Main stage banner', 'Entrance arch signage', 'Wayfinding signs', 'Photo wall branding', 'Jumbotron spot'],
  'digital': ['Social media posts (3x)', 'Email newsletter mention', 'Website banner', 'App push notification', 'Live-stream overlay'],
  'hospitality': ['VIP lounge branding', 'Branded drink coasters', 'VIP gift bags', 'Hospitality suite access', 'Catering tent signage'],
  'in-venue': ['Booth space 10x10', 'Product sampling station', 'PA announcements (3x)', 'Lanyard sponsorship', 'Branded wristbands'],
  'talent': ['Halftime performer', 'Guest DJ set', 'MC hosting', 'Meet-and-greet appearance', 'Panel moderator'],
  'content': ['Recap video mention', 'Podcast ad read', 'Blog post feature', 'Press release inclusion', 'Photography package'],
}

function proofSvg(label: string): string {
  const hue = Math.floor(Math.random() * 360)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect fill='hsl(${hue},40%,30%)' width='800' height='600' rx='8'/><text x='400' y='290' text-anchor='middle' fill='white' font-size='22' font-family='system-ui' opacity='0.7'>${label}</text><text x='400' y='330' text-anchor='middle' fill='white' font-size='14' font-family='system-ui' opacity='0.4'>proof of performance</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function dateStr(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Seed action
// ---------------------------------------------------------------------------

export async function seedPerfDataset(): Promise<{
  ok: boolean
  error?: string
  summary?: { events: number; partners: number; deliverables: number; proofs: number }
}> {
  if (process.env.NODE_ENV !== 'development') {
    return { ok: false, error: 'Seed is only available in development' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { ok: false, error: 'Not authenticated' }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) return { ok: false, error: 'No organization membership' }
  if (!canManageContent(membership.role as OrgRole)) return { ok: false, error: 'Insufficient permissions' }

  const orgId = membership.org_id

  try {
    // 1. Create season
    const { data: season, error: seasonErr } = await supabase
      .from('seasons')
      .insert({ org_id: orgId, name: '2025 Concert Series', start_date: dateStr(-60), end_date: dateStr(90) })
      .select()
      .single()

    if (seasonErr) {
      console.error('[seed] Season insert failed:', seasonErr)
      // Continue without season
    }

    const seasonId = season?.id ?? null

    // 2. Create events
    const eventRows = EVENTS.map((e) => ({
      org_id: orgId,
      name: e.name,
      status: e.status,
      date: dateStr(e.daysFromNow),
      venue: e.venue,
      season_id: seasonId,
    }))

    const { data: events, error: eventErr } = await supabase
      .from('events')
      .insert(eventRows)
      .select()

    if (eventErr || !events) return { ok: false, error: `Event insert failed: ${eventErr?.message}` }

    // 3. Create partners — 4 per event
    const partnerRows = events.flatMap((event, eventIdx) =>
      PARTNER_NAMES.slice(eventIdx * 4, eventIdx * 4 + 4).map((name, i) => ({
        org_id: orgId,
        event_id: event.id,
        name,
        contact_name: `${name.split(' ')[0]} Contact`,
        contact_email: `contact@${name.toLowerCase().replace(/\s+/g, '')}.com`,
        deal_value: (i + 1) * 5000 + eventIdx * 10000,
        contract_notes: `${name} partnership for ${event.name}. Includes all listed deliverables.`,
      }))
    )

    const { data: partners, error: partnerErr } = await supabase
      .from('partners')
      .insert(partnerRows)
      .select()

    if (partnerErr || !partners) return { ok: false, error: `Partner insert failed: ${partnerErr?.message}` }

    // 4. Create deliverables — 5 per partner
    const deliverableRows = partners.flatMap((partner) => {
      const event = events.find((e) => e.id === partner.event_id)!
      const statuses = STATUSES_BY_EVENT[event.status as EventStatus]
      return CATEGORIES.map((cat, i) => ({
        org_id: orgId,
        event_id: event.id,
        partner_id: partner.id,
        title: DELIVERABLE_TITLES[cat][i % DELIVERABLE_TITLES[cat].length],
        category: cat,
        status: statuses[i],
        due_date: dateStr(
          (event.status === 'completed' ? -35 : event.status === 'active' ? 3 : 40) + i * 2
        ),
        proof_required: true,
        notes: null,
      }))
    })

    const { data: deliverables, error: delErr } = await supabase
      .from('deliverables')
      .insert(deliverableRows)
      .select()

    if (delErr || !deliverables) return { ok: false, error: `Deliverable insert failed: ${delErr?.message}` }

    // 5. Create proofs for done/proved deliverables
    const proofCandidates = deliverables.filter(
      (d) => d.status === 'done' || d.status === 'proved'
    )

    const proofRows = proofCandidates.map((d) => ({
      deliverable_id: d.id,
      org_id: orgId,
      file_url: proofSvg(d.title),
      file_name: `${d.title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      file_type: 'image/svg+xml',
      file_size: 2_400_000,
      uploaded_by: user.id,
    }))

    let proofCount = 0
    if (proofRows.length > 0) {
      const { data: proofs, error: proofErr } = await supabase
        .from('proofs')
        .insert(proofRows)
        .select()

      if (proofErr) {
        console.error('[seed] Proof insert failed:', proofErr)
      } else {
        proofCount = proofs?.length ?? 0
      }
    }

    // 6. Log activity entries
    const activityPromises = events.map((event) =>
      logActivity({
        orgId,
        userId: user.id,
        action: 'created',
        targetType: 'event',
        targetId: event.id,
        eventId: event.id,
        details: { name: event.name },
      })
    )

    activityPromises.push(
      ...partners.slice(0, 6).map((p) =>
        logActivity({
          orgId,
          userId: user.id,
          action: 'created',
          targetType: 'partner',
          targetId: p.id,
          eventId: p.event_id,
          details: { name: p.name },
        })
      )
    )

    activityPromises.push(
      ...deliverables
        .filter((d) => d.status === 'proved')
        .slice(0, 6)
        .map((d) =>
          logActivity({
            orgId,
            userId: user.id,
            action: 'uploaded_proof',
            targetType: 'proof',
            targetId: d.id,
            eventId: d.event_id,
            details: { deliverable_title: d.title },
          })
        )
    )

    await Promise.allSettled(activityPromises)

    return {
      ok: true,
      summary: {
        events: events.length,
        partners: partners.length,
        deliverables: deliverables.length,
        proofs: proofCount,
      },
    }
  } catch (err) {
    console.error('[seed] Unexpected error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
