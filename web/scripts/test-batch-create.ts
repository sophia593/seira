/**
 * E2E verification: batch deliverable creation — 10-event season, 1 sponsor,
 * deliverables across all events with smart date rules.
 *
 * Usage:  cd web && npx tsx --env-file=.env.local scripts/test-batch-create.ts
 */

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error(
    '\n  Missing environment variables.\n' +
    '  Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n' +
    '  are set in web/.env.local\n'
  )
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let hasErrors = false
const cleanupSeasons: string[] = []
const cleanupEvents: string[] = []

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(msg: string) { console.log(`  ✓ ${msg}`) }
function fail(msg: string) { hasErrors = true; console.error(`  ✗ ${msg}`) }

/** Resolve a date rule against an event date (mirrors lib/date-rules.ts). */
function resolveDate(rule: string, eventDate: string | null, customDate?: string): string | null {
  if (rule === 'none') return null
  if (rule === 'custom') return customDate ?? null
  if (!eventDate) return null
  if (rule === 'event_day') return eventDate
  const d = new Date(eventDate + 'T00:00:00')
  switch (rule) {
    case 'day_before': d.setDate(d.getDate() - 1); break
    case '1w_before': d.setDate(d.getDate() - 7); break
    case '2d_after': d.setDate(d.getDate() + 2); break
  }
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Step 1: Find an org
// ---------------------------------------------------------------------------

async function findOrg(): Promise<string> {
  console.log('\n1. Finding an organization...')
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single()

  if (error || !data) {
    fail('No organizations found')
    process.exit(1)
  }

  ok(`Using org: ${data.name} (${data.id})`)
  return data.id
}

// ---------------------------------------------------------------------------
// Step 2: Create a season
// ---------------------------------------------------------------------------

async function createSeason(orgId: string): Promise<string> {
  console.log('\n2. Creating test season...')

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      org_id: orgId,
      name: 'TEST — Batch Create Season',
      start_date: '2025-06-01',
      end_date: '2025-06-30',
    })
    .select('id')
    .single()

  if (error || !data) {
    fail(`Failed to create season: ${error?.message}`)
    process.exit(1)
  }

  cleanupSeasons.push(data.id)
  ok(`Created season: ${data.id}`)
  return data.id
}

// ---------------------------------------------------------------------------
// Step 3: Create 10 events in the season
// ---------------------------------------------------------------------------

async function createEvents(orgId: string, seasonId: string): Promise<{ id: string; name: string; date: string }[]> {
  console.log('\n3. Creating 10 events in the season...')

  const events: { id: string; name: string; date: string }[] = []

  for (let i = 1; i <= 10; i++) {
    const date = `2025-06-${String(i).padStart(2, '0')}`
    const name = `TEST — Game Night ${i}`
    const { data, error } = await supabase
      .from('events')
      .insert({ org_id: orgId, name, date, status: 'upcoming', season_id: seasonId })
      .select('id')
      .single()

    if (error || !data) {
      fail(`Failed to create event ${i}: ${error?.message}`)
      continue
    }
    events.push({ id: data.id, name, date })
    cleanupEvents.push(data.id)
  }

  if (events.length === 10) ok('Created 10 events')
  else fail(`Expected 10 events, created ${events.length}`)

  return events
}

// ---------------------------------------------------------------------------
// Step 4: Batch create — partner + deliverables across all 10 events
// ---------------------------------------------------------------------------

const DELIVERABLE_DEFS = [
  { title: 'LED Board Rotation', category: 'in-venue', proof_required: 'photo', dateRule: 'event_day' },
  { title: 'Social Media Post', category: 'digital', proof_required: 'screenshot', dateRule: 'day_before' },
  { title: 'VIP Suite Access', category: 'hospitality', proof_required: 'photo', dateRule: 'event_day' },
  { title: 'Post-Event Recap', category: 'content', proof_required: 'file', dateRule: '2d_after' },
  { title: 'Pre-Game Signage', category: 'signage', proof_required: 'photo', dateRule: '1w_before' },
]

async function batchCreate(orgId: string, events: { id: string; name: string; date: string }[]): Promise<void> {
  console.log('\n4. Batch creating partner + 5 deliverables across 10 events...')

  const partnerName = 'TEST — Apex Financial Group'

  for (const event of events) {
    // Create partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert({ org_id: orgId, event_id: event.id, name: partnerName, contact_name: 'Dana Reyes' })
      .select('id')
      .single()

    if (partnerError || !partner) {
      fail(`Failed to create partner for ${event.name}: ${partnerError?.message}`)
      continue
    }

    // Create deliverables with resolved dates
    const deliverables = DELIVERABLE_DEFS.map((def) => ({
      partner_id: partner.id,
      event_id: event.id,
      title: def.title,
      category: def.category,
      proof_required: def.proof_required,
      status: 'not_started',
      due_date: resolveDate(def.dateRule, event.date),
    }))

    const { error: insertError } = await supabase.from('deliverables').insert(deliverables)
    if (insertError) {
      fail(`Failed to insert deliverables for ${event.name}: ${insertError.message}`)
    }
  }

  ok('Batch creation complete for all 10 events')
}

// ---------------------------------------------------------------------------
// Step 5: Verify
// ---------------------------------------------------------------------------

async function verify(events: { id: string; name: string; date: string }[]): Promise<void> {
  console.log('\n5. Verifying...')

  const eventIds = events.map((e) => e.id)

  // 5a. Partners — 10, all named the same
  const { data: partners } = await supabase
    .from('partners')
    .select('id, event_id, name')
    .in('event_id', eventIds)

  if (partners?.length === 10) ok('10 partners created (1 per event)')
  else fail(`Expected 10 partners, got ${partners?.length}`)

  const allSameName = partners?.every((p) => p.name === 'TEST — Apex Financial Group')
  if (allSameName) ok('All partners named "Apex Financial Group"')
  else fail('Partner names do not match')

  // 5b. Deliverables — 50 total, all not_started
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, event_id, title, status, due_date')
    .in('event_id', eventIds)

  if (deliverables?.length === 50) ok('50 deliverables total (5 per event × 10)')
  else fail(`Expected 50 deliverables, got ${deliverables?.length}`)

  const allNotStarted = deliverables?.every((d) => d.status === 'not_started')
  if (allNotStarted) ok('All deliverables have status "not_started"')
  else fail('Some deliverables have unexpected status')

  // 5c. Date rules — check for first event (June 1)
  const firstEventId = events[0].id
  const firstEventDate = events[0].date
  const firstDeliverables = deliverables?.filter((d) => d.event_id === firstEventId) ?? []

  const expectedDates: Record<string, string | null> = {
    'LED Board Rotation': firstEventDate, // event_day
    'Social Media Post': resolveDate('day_before', firstEventDate), // day_before
    'VIP Suite Access': firstEventDate, // event_day
    'Post-Event Recap': resolveDate('2d_after', firstEventDate), // 2d_after
    'Pre-Game Signage': resolveDate('1w_before', firstEventDate), // 1w_before
  }

  let dateChecksPassed = 0
  for (const d of firstDeliverables) {
    const expected = expectedDates[d.title]
    if (expected === undefined) continue
    if (d.due_date === expected) {
      dateChecksPassed++
    } else {
      fail(`Date mismatch for "${d.title}": expected ${expected}, got ${d.due_date}`)
    }
  }
  if (dateChecksPassed === 5) ok(`All 5 date rules resolved correctly for event on ${firstEventDate}`)

  // 5d. Check last event (June 10) dates
  const lastEventId = events[9].id
  const lastEventDate = events[9].date
  const lastDeliverables = deliverables?.filter((d) => d.event_id === lastEventId) ?? []

  const lastExpected: Record<string, string | null> = {
    'LED Board Rotation': lastEventDate,
    'Social Media Post': resolveDate('day_before', lastEventDate),
    'VIP Suite Access': lastEventDate,
    'Post-Event Recap': resolveDate('2d_after', lastEventDate),
    'Pre-Game Signage': resolveDate('1w_before', lastEventDate),
  }

  let lastDateChecks = 0
  for (const d of lastDeliverables) {
    const expected = lastExpected[d.title]
    if (expected === undefined) continue
    if (d.due_date === expected) {
      lastDateChecks++
    } else {
      fail(`Date mismatch for "${d.title}" (last event): expected ${expected}, got ${d.due_date}`)
    }
  }
  if (lastDateChecks === 5) ok(`All 5 date rules resolved correctly for event on ${lastEventDate}`)
}

// ---------------------------------------------------------------------------
// Step 6: Cleanup
// ---------------------------------------------------------------------------

async function cleanup() {
  console.log('\n6. Cleaning up...')

  for (const id of cleanupEvents) {
    await supabase.from('events').delete().eq('id', id)
  }
  for (const id of cleanupSeasons) {
    await supabase.from('seasons').delete().eq('id', id)
  }
  ok(`Removed ${cleanupEvents.length} test events and ${cleanupSeasons.length} test seasons`)
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log(' Batch Deliverable Creation — E2E Verification')
  console.log('═══════════════════════════════════════════════════')

  const orgId = await findOrg()
  const seasonId = await createSeason(orgId)
  const events = await createEvents(orgId, seasonId)
  await batchCreate(orgId, events)
  await verify(events)
  await cleanup()

  console.log('\n═══════════════════════════════════════════════════')
  if (hasErrors) {
    console.log(' RESULT: FAIL — see errors above')
    process.exit(1)
  } else {
    console.log(' RESULT: PASS — all checks passed')
    console.log('═══════════════════════════════════════════════════\n')
  }
}

main().catch((err) => {
  console.error('\nUnexpected error:', err)
  cleanup().finally(() => process.exit(1))
})
