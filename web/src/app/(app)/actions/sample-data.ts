'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import type { DeliverableCategory, DeliverableStatus, ProofRequired, TemplateDeliverable } from '@/lib/types/database'
import type { SupabaseClient } from '@/lib/db/client'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

interface SeedDeliverable {
  title: string
  category: DeliverableCategory
  status: DeliverableStatus
  due_date: string | null
  proof_required: ProofRequired
  notes: string | null
}

// ---------------------------------------------------------------------------
// Event 1 partners + deliverables — Charity Gala
// ---------------------------------------------------------------------------

const GALA_PARTNERS: {
  name: string
  contact_name: string
  contact_email: string
  contract_notes: string
  deliverables: SeedDeliverable[]
}[] = [
  {
    name: 'Northern Trust Wealth',
    contact_name: 'Caroline Whitfield',
    contact_email: 'c.whitfield@northerntrust.com',
    contract_notes: '$75K — presenting sponsor, step & repeat, 2 tables, full digital package',
    deliverables: [
      { title: 'Step & repeat logo placement', category: 'signage', status: 'proved', due_date: daysFromNow(-5), proof_required: 'photo', notes: '8x10 ft backdrop — logo top-center, 18" height' },
      { title: 'Table signage (2 tables)', category: 'signage', status: 'done', due_date: daysFromNow(-3), proof_required: 'photo', notes: 'Tables 4 & 5, branded centerpieces + tent cards' },
      { title: 'Instagram recap carousel', category: 'digital', status: 'not_started', due_date: daysFromNow(3), proof_required: 'screenshot', notes: '4-slide carousel, tag @northerntrustwm, stories cross-post' },
      { title: 'Email newsletter feature', category: 'digital', status: 'not_started', due_date: daysFromNow(7), proof_required: 'screenshot', notes: 'Above-fold logo + 50-word blurb in post-event send' },
      { title: 'Emcee recognition (2x)', category: 'in-venue', status: 'in_progress', due_date: daysFromNow(0), proof_required: 'file', notes: 'Opening remarks + before live auction, scripted reads provided' },
      { title: 'Post-event impact report', category: 'content', status: 'not_started', due_date: daysFromNow(14), proof_required: 'file', notes: 'PDF with attendance, funds raised, brand exposure metrics' },
    ],
  },
  {
    name: 'Elara Hotels & Resorts',
    contact_name: 'Marcus Tan',
    contact_email: 'mtan@elarahotels.com',
    contract_notes: '$40K — silent auction sponsor, lounge branding, social media',
    deliverables: [
      { title: 'Silent auction title signage', category: 'signage', status: 'proved', due_date: daysFromNow(-7), proof_required: 'photo', notes: 'Presented by Elara — header banner + bid sheet footers' },
      { title: 'VIP lounge branding', category: 'signage', status: 'in_progress', due_date: daysFromNow(0), proof_required: 'photo', notes: 'Branded napkins, coasters, and lounge entrance sign' },
      { title: 'Social media thank-you post', category: 'digital', status: 'not_started', due_date: daysFromNow(2), proof_required: 'screenshot', notes: 'Single image post, tag @elarahotels, mention auction highlights' },
      { title: 'Gift bag insert', category: 'in-venue', status: 'done', due_date: null, proof_required: 'photo', notes: '$50 resort credit card — 400 qty, provided by sponsor' },
    ],
  },
  {
    name: 'Juniper & Thorn Florals',
    contact_name: 'Priya Naidu',
    contact_email: 'priya@juniperandthorn.co',
    contract_notes: '$12K — in-kind centerpieces + branding, social tags',
    deliverables: [
      { title: 'Centerpiece arrangements (30 tables)', category: 'in-venue', status: 'done', due_date: daysFromNow(-1), proof_required: 'photo', notes: 'Seasonal floral, branded tag on each arrangement' },
      { title: 'Instagram story mention', category: 'digital', status: 'not_started', due_date: daysFromNow(1), proof_required: 'screenshot', notes: 'Story with arrangement close-up, tag @juniperandthorn' },
      { title: 'Logo on printed program', category: 'content', status: 'proved', due_date: daysFromNow(-10), proof_required: 'file', notes: 'Quarter-page ad, inside back cover' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Event 2 partners + deliverables — Summer Music Festival
// ---------------------------------------------------------------------------

const FESTIVAL_PARTNERS: {
  name: string
  contact_name: string
  contact_email: string
  contract_notes: string
  deliverables: SeedDeliverable[]
}[] = [
  {
    name: 'Velo Brewing Co.',
    contact_name: 'Jake Moreno',
    contact_email: 'jake@velobrewing.com',
    contract_notes: '$55K — beer garden naming rights, stage banner, sampling, digital',
    deliverables: [
      { title: 'Beer garden naming rights signage', category: 'signage', status: 'in_progress', due_date: daysFromNow(12), proof_required: 'photo', notes: '"The Velo Beer Garden" — entry arch + 3 interior signs' },
      { title: 'Main stage banner', category: 'signage', status: 'not_started', due_date: daysFromNow(18), proof_required: 'photo', notes: '20x4 ft vinyl banner, stage-left position' },
      { title: 'Product sampling activation', category: 'in-venue', status: 'not_started', due_date: daysFromNow(20), proof_required: 'photo', notes: '2 sampling stations, branded cups, 500 samples/day' },
      { title: 'Instagram Reel — festival hype', category: 'digital', status: 'not_started', due_date: daysFromNow(10), proof_required: 'screenshot', notes: '15-30s Reel, Velo product in frame, festival lineup tease' },
      { title: 'Post-festival recap video', category: 'content', status: 'not_started', due_date: daysFromNow(30), proof_required: 'link', notes: '90-second highlight reel, Velo branding in intro/outro' },
    ],
  },
  {
    name: 'Solaris Energy',
    contact_name: 'Anika Patel',
    contact_email: 'apatel@solarisenergy.io',
    contract_notes: '$30K — charging lounge, digital signage, sustainability co-branding',
    deliverables: [
      { title: 'Phone charging lounge branding', category: 'signage', status: 'not_started', due_date: daysFromNow(18), proof_required: 'photo', notes: '"Powered by Solaris" — tent, furniture wraps, banner' },
      { title: 'LED screen rotation (all stages)', category: 'in-venue', status: 'not_started', due_date: daysFromNow(20), proof_required: 'photo', notes: '15-second spot, 4x per hour across 3 stages' },
      { title: 'Festival app banner ad', category: 'digital', status: 'in_progress', due_date: daysFromNow(8), proof_required: 'screenshot', notes: '728x90 banner, links to solarisenergy.io/festival' },
      { title: 'Sustainability pledge co-brand', category: 'content', status: 'not_started', due_date: daysFromNow(15), proof_required: 'file', notes: 'Joint statement on event website + printed at info booth' },
    ],
  },
  {
    name: 'Ridgeline Outdoor Apparel',
    contact_name: 'Sam Okonkwo',
    contact_email: 'sam@ridgelineoutdoor.com',
    contract_notes: '$18K — merch tent co-brand, wristband sponsor, social content',
    deliverables: [
      { title: 'Co-branded merch tent', category: 'in-venue', status: 'not_started', due_date: daysFromNow(19), proof_required: 'photo', notes: 'Ridgeline logo on tent exterior + product display inside' },
      { title: 'Wristband logo print', category: 'signage', status: 'in_progress', due_date: daysFromNow(5), proof_required: 'photo', notes: 'Logo on all GA + VIP wristbands, 5000 qty, files sent' },
      { title: 'TikTok festival outfit feature', category: 'digital', status: 'not_started', due_date: daysFromNow(22), proof_required: 'screenshot', notes: '"Festival fits powered by Ridgeline" — UGC style, 30-60s' },
      { title: 'Photo booth backdrop', category: 'in-venue', status: 'not_started', due_date: daysFromNow(18), proof_required: 'photo', notes: '6x8 ft branded backdrop + props, Ridgeline hashtag overlay' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Global template seed data
// ---------------------------------------------------------------------------

const GLOBAL_TEMPLATES: {
  name: string
  industry: 'sports' | 'venue' | 'festival' | 'film'
  deliverables: TemplateDeliverable[]
}[] = [
  {
    name: 'Sports Package',
    industry: 'sports',
    deliverables: [
      { title: 'LED board rotation', category: 'in-venue', proof_required: 'photo' },
      { title: 'PA announcements', category: 'in-venue', proof_required: 'file' },
      { title: 'Social media post', category: 'digital', proof_required: 'screenshot' },
      { title: 'Logo on event program', category: 'signage', proof_required: 'photo' },
      { title: 'VIP hospitality suite', category: 'hospitality', proof_required: 'photo' },
      { title: 'Halftime feature', category: 'content', proof_required: 'photo' },
    ],
  },
  {
    name: 'Venue Package',
    industry: 'venue',
    deliverables: [
      { title: 'Naming rights signage', category: 'signage', proof_required: 'photo' },
      { title: 'Digital display rotation', category: 'digital', proof_required: 'screenshot' },
      { title: 'Welcome desk branding', category: 'signage', proof_required: 'photo' },
      { title: 'Event program ad', category: 'content', proof_required: 'file' },
      { title: 'VIP lounge branding', category: 'hospitality', proof_required: 'photo' },
      { title: 'Post-event social recap', category: 'digital', proof_required: 'screenshot' },
    ],
  },
  {
    name: 'Festival Package',
    industry: 'festival',
    deliverables: [
      { title: 'Stage banner', category: 'signage', proof_required: 'photo' },
      { title: 'Branded activation booth', category: 'in-venue', proof_required: 'photo' },
      { title: 'Social media story', category: 'digital', proof_required: 'screenshot' },
      { title: 'Artist meet & greet access', category: 'hospitality', proof_required: 'photo' },
      { title: 'On-site sampling', category: 'in-venue', proof_required: 'photo' },
      { title: 'Festival app banner', category: 'digital', proof_required: 'screenshot' },
      { title: 'Post-festival recap video', category: 'content', proof_required: 'file' },
    ],
  },
  {
    name: 'Film Package',
    industry: 'film',
    deliverables: [
      { title: 'Red carpet backdrop', category: 'signage', proof_required: 'photo' },
      { title: 'Program book ad', category: 'content', proof_required: 'file' },
      { title: 'Pre-show reel placement', category: 'digital', proof_required: 'file' },
      { title: 'VIP after-party branding', category: 'hospitality', proof_required: 'photo' },
      { title: 'Social media post', category: 'digital', proof_required: 'screenshot' },
      { title: 'Press wall logo', category: 'signage', proof_required: 'photo' },
    ],
  },
]

async function seedGlobalTemplates(supabase: SupabaseClient): Promise<void> {
  // Check if global templates already exist
  const { count } = await supabase
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .is('org_id', null)

  if ((count ?? 0) > 0) return

  const rows = GLOBAL_TEMPLATES.map((t) => ({
    org_id: null,
    name: t.name,
    industry: t.industry,
    deliverables: t.deliverables,
  }))

  const { error } = await supabase.from('templates').insert(rows)
  if (error) {
    console.error('Failed to seed global templates:', error)
  }
}

export async function seedSampleDataAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Not authenticated' }
    }

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) {
      return { ok: false, error: 'No organization membership' }
    }

    const orgId = membership.org_id

    // Ensure global templates exist
    await seedGlobalTemplates(supabase)

    // Guardrail: only seed if workspace is empty
    const { count, error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)

    if (countError) {
      return { ok: false, error: 'Failed to check existing events' }
    }

    if ((count ?? 0) > 0) {
      return { ok: false, error: 'Workspace already has events' }
    }

    // Insert 2 events
    const eventRows = [
      { org_id: orgId, name: 'Annual Charity Gala 2025', status: 'upcoming', date: daysFromNow(5), venue: 'The Langford Grand Ballroom', notes: 'Black-tie fundraiser — 400 guests, live auction, full sponsor activation' },
      { org_id: orgId, name: 'Riverside Summer Music Festival', status: 'upcoming', date: daysFromNow(22), venue: 'Crestwood Amphitheater', notes: 'Two-day outdoor festival — 3 stages, 15K capacity, camping + VIP areas' },
    ]

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .insert(eventRows)
      .select('id')

    if (eventsError || !events) {
      return { ok: false, error: 'Failed to create sample events' }
    }

    // Map events to their respective partner sets
    const eventPartnerMap = [
      { eventId: events[0].id, partners: GALA_PARTNERS },
      { eventId: events[1].id, partners: FESTIVAL_PARTNERS },
    ]

    // Insert partners for each event
    const partnerRows = eventPartnerMap.flatMap(({ eventId, partners }) =>
      partners.map((p) => ({
        org_id: orgId,
        event_id: eventId,
        name: p.name,
        contact_name: p.contact_name,
        contact_email: p.contact_email,
        contract_notes: p.contract_notes,
      }))
    )

    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .insert(partnerRows)
      .select('id, event_id, name')

    if (partnersError || !partners) {
      return { ok: false, error: 'Failed to create sample partners' }
    }

    // Build a lookup: partner name + event_id → deliverables
    const allPartnerDefs = [...GALA_PARTNERS, ...FESTIVAL_PARTNERS]

    const deliverableRows = partners.flatMap((partner) => {
      const def = allPartnerDefs.find((p) => p.name === partner.name)
      if (!def) return []
      return def.deliverables.map((d) => ({
        partner_id: partner.id,
        event_id: partner.event_id,
        title: d.title,
        category: d.category,
        status: d.status,
        due_date: d.due_date,
        proof_required: d.proof_required,
        notes: d.notes,
      }))
    })

    const { error: deliverablesError } = await supabase
      .from('deliverables')
      .insert(deliverableRows)

    if (deliverablesError) {
      return { ok: false, error: 'Failed to create sample deliverables' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/events')

    return { ok: true }
  } catch (err) {
    console.error('seedSampleDataAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to seed sample data' }
  }
}
