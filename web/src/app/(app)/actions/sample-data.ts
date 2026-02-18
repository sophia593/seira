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

const PARTNERS = [
  {
    name: 'Apex Financial Group',
    contact_name: 'Dana Reyes',
    contact_email: 'dreyes@apexfg.com',
    contract_notes: '$35K — LED boards, 2 social posts, premium suite',
  },
  {
    name: 'Brightwave Energy',
    contact_name: 'Jordan Hale',
    contact_email: 'jhale@brightwave.co',
    contract_notes: '$50K — main stage banner, digital campaign, VIP hospitality, recap video',
  },
  {
    name: 'Catalina Brewing Co.',
    contact_name: 'Mia Rosario',
    contact_email: 'mia@catalinabrewing.com',
    contract_notes: '$20K — concourse signage, PA mentions, sampling activation',
  },
]

function makeDeliverables(): SeedDeliverable[] {
  return [
    {
      title: 'LED board rotation',
      category: 'in-venue',
      status: 'in_progress',
      due_date: daysFromNow(5),
      proof_required: 'photo',
      notes: '30-second rotation during breaks',
    },
    {
      title: 'Social media post',
      category: 'digital',
      status: 'not_started',
      due_date: daysFromNow(8),
      proof_required: 'screenshot',
      notes: 'Instagram carousel — 3 slides, tag partner',
    },
    {
      title: 'Suite access for 8',
      category: 'hospitality',
      status: 'done',
      due_date: null,
      proof_required: 'photo',
      notes: 'Suite 204, catering included',
    },
    {
      title: 'Concourse banner',
      category: 'signage',
      status: 'proved',
      due_date: daysFromNow(-10),
      proof_required: 'photo',
      notes: 'Main concourse entrance, 4x8 ft banner',
    },
    {
      title: 'PA announcement',
      category: 'in-venue',
      status: 'not_started',
      due_date: daysFromNow(-3),
      proof_required: 'file',
      notes: '15-second read during halftime break',
    },
    {
      title: 'Recap video clip',
      category: 'content',
      status: 'not_started',
      due_date: daysFromNow(-1),
      proof_required: 'link',
      notes: '60-second highlight reel with partner branding',
    },
  ]
}

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
      { org_id: orgId, name: 'Legends Cup — Opening Night', status: 'upcoming', date: daysFromNow(10), venue: 'Meridian Field', notes: 'Season opener — full partner activation' },
      { org_id: orgId, name: 'Neon Nights Music Festival', status: 'upcoming', date: daysFromNow(25), venue: 'Harborview Pavilion', notes: 'Two-day festival, 3 stages' },
    ]

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .insert(eventRows)
      .select('id')

    if (eventsError || !events) {
      return { ok: false, error: 'Failed to create sample events' }
    }

    // Insert 3 partners per event
    const partnerRows = events.flatMap((event) =>
      PARTNERS.map((p) => ({
        org_id: orgId,
        event_id: event.id,
        name: p.name,
        contact_name: p.contact_name,
        contact_email: p.contact_email,
        contract_notes: p.contract_notes,
      }))
    )

    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .insert(partnerRows)
      .select('id, event_id')

    if (partnersError || !partners) {
      return { ok: false, error: 'Failed to create sample partners' }
    }

    // Insert 6 deliverables per partner
    const deliverableRows = partners.flatMap((partner) =>
      makeDeliverables().map((d) => ({
        partner_id: partner.id,
        event_id: partner.event_id,
        title: d.title,
        category: d.category,
        status: d.status,
        due_date: d.due_date,
        proof_required: d.proof_required,
        notes: d.notes,
      }))
    )

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
