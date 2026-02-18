/**
 * E2E verification: seasons feature — CRUD, event assignment, combined stats.
 *
 * Creates a season, assigns events with deliverables, verifies stats,
 * reassigns events, deletes season (events survive with null season_id).
 *
 * Usage:  cd web && npx tsx --env-file=.env.local scripts/test-seasons.ts
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
// Step 2: Create season
// ---------------------------------------------------------------------------

async function createSeason(orgId: string): Promise<string> {
  console.log('\n2. Creating season...')

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      org_id: orgId,
      name: 'TEST — 2025 Summer Series',
      start_date: '2025-06-01',
      end_date: '2025-08-31',
    })
    .select('id, name, start_date, end_date')
    .single()

  if (error || !data) {
    fail(`Failed to create season: ${error?.message}`)
    process.exit(1)
  }

  cleanupSeasons.push(data.id)
  ok(`Created season: ${data.name} (${data.id})`)

  if (data.start_date !== '2025-06-01') fail(`start_date mismatch: ${data.start_date}`)
  else ok('start_date correct')

  if (data.end_date !== '2025-08-31') fail(`end_date mismatch: ${data.end_date}`)
  else ok('end_date correct')

  return data.id
}

// ---------------------------------------------------------------------------
// Step 3: Create events with deliverables, assign to season
// ---------------------------------------------------------------------------

async function createEvents(orgId: string, seasonId: string): Promise<string[]> {
  console.log('\n3. Creating 3 events (2 assigned to season, 1 unassigned)...')

  const eventDefs = [
    { name: 'TEST — June Kickoff', date: '2025-06-15', season_id: seasonId },
    { name: 'TEST — July Main Event', date: '2025-07-20', season_id: seasonId },
    { name: 'TEST — Standalone Gala', date: '2025-09-10', season_id: null },
  ]

  const eventIds: string[] = []
  for (const def of eventDefs) {
    const { data, error } = await supabase
      .from('events')
      .insert({ org_id: orgId, ...def, status: 'upcoming' })
      .select('id')
      .single()
    if (error || !data) {
      fail(`Failed to create event ${def.name}: ${error?.message}`)
      continue
    }
    eventIds.push(data.id)
    cleanupEvents.push(data.id)
  }
  ok(`Created ${eventIds.length} events`)

  // Add a partner + deliverables to each event
  for (let i = 0; i < eventIds.length; i++) {
    const eventId = eventIds[i]
    const { data: partner } = await supabase
      .from('partners')
      .insert({ org_id: orgId, event_id: eventId, name: `Partner ${i + 1}` })
      .select('id')
      .single()

    if (!partner) continue

    const deliverables = Array.from({ length: 5 }, (_, j) => ({
      partner_id: partner.id,
      event_id: eventId,
      title: `Deliverable ${i + 1}-${j + 1}`,
      category: 'digital',
      status: j < 2 ? 'done' : j < 3 ? 'in_progress' : 'not_started',
      proof_required: 'photo',
    }))

    await supabase.from('deliverables').insert(deliverables)
  }
  ok('Added partners + 5 deliverables each (2 done, 1 in_progress, 2 not_started)')

  return eventIds
}

// ---------------------------------------------------------------------------
// Step 4: Verify season stats
// ---------------------------------------------------------------------------

async function verifyStats(seasonId: string) {
  console.log('\n4. Verifying season stats...')

  // Events in season
  const { data: seasonEvents } = await supabase
    .from('events')
    .select('id')
    .eq('season_id', seasonId)

  if (seasonEvents?.length === 2) ok('2 events assigned to season')
  else fail(`Expected 2 events, got ${seasonEvents?.length}`)

  // Deliverables in season events
  const eventIds = seasonEvents?.map(e => e.id) ?? []
  const { data: deliverables } = eventIds.length > 0
    ? await supabase.from('deliverables').select('id, status').in('event_id', eventIds)
    : { data: [] }

  const total = deliverables?.length ?? 0
  const completed = deliverables?.filter(d => d.status === 'done' || d.status === 'proved').length ?? 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  if (total === 10) ok(`Total deliverables: ${total}`)
  else fail(`Expected 10 deliverables, got ${total}`)

  if (completed === 4) ok(`Completed deliverables: ${completed} (2 done per event × 2 events)`)
  else fail(`Expected 4 completed, got ${completed}`)

  if (pct === 40) ok(`Completion: ${pct}%`)
  else fail(`Expected 40%, got ${pct}%`)
}

// ---------------------------------------------------------------------------
// Step 5: Update season
// ---------------------------------------------------------------------------

async function updateSeason(seasonId: string) {
  console.log('\n5. Updating season...')

  const { data, error } = await supabase
    .from('seasons')
    .update({ name: 'TEST — 2025 Summer Series (Updated)', end_date: '2025-09-30' })
    .eq('id', seasonId)
    .select('name, end_date')
    .single()

  if (error) fail(`Update failed: ${error.message}`)
  else if (data?.name === 'TEST — 2025 Summer Series (Updated)' && data?.end_date === '2025-09-30') {
    ok('Season name and end_date updated')
  } else {
    fail(`Update result unexpected: ${JSON.stringify(data)}`)
  }
}

// ---------------------------------------------------------------------------
// Step 6: Reassign event to season
// ---------------------------------------------------------------------------

async function reassignEvent(eventIds: string[], seasonId: string) {
  console.log('\n6. Reassigning unassigned event to season...')

  const unassignedId = eventIds[2] // The standalone gala

  const { error } = await supabase
    .from('events')
    .update({ season_id: seasonId })
    .eq('id', unassignedId)

  if (error) {
    fail(`Reassign failed: ${error.message}`)
    return
  }
  ok('Moved standalone event into season')

  // Verify 3 events now in season
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('season_id', seasonId)

  if (data?.length === 3) ok('Season now has 3 events')
  else fail(`Expected 3, got ${data?.length}`)

  // Unassign it back
  await supabase.from('events').update({ season_id: null }).eq('id', unassignedId)
  ok('Restored to unassigned')
}

// ---------------------------------------------------------------------------
// Step 7: Delete season — events survive
// ---------------------------------------------------------------------------

async function deleteSeasonTest(seasonId: string, eventIds: string[]) {
  console.log('\n7. Deleting season — events should survive with null season_id...')

  const { error } = await supabase.from('seasons').delete().eq('id', seasonId)
  if (error) {
    fail(`Delete failed: ${error.message}`)
    return
  }

  // Remove from cleanup since already deleted
  const idx = cleanupSeasons.indexOf(seasonId)
  if (idx >= 0) cleanupSeasons.splice(idx, 1)

  ok('Season deleted')

  // Verify events still exist
  const { data: surviving } = await supabase
    .from('events')
    .select('id, season_id')
    .in('id', eventIds)

  if (surviving?.length === 3) ok('All 3 events still exist')
  else fail(`Expected 3 events, got ${surviving?.length}`)

  const allNull = surviving?.every(e => e.season_id === null) ?? false
  if (allNull) ok('All events have season_id = null (ON DELETE SET NULL)')
  else fail(`Some events still have season_id set: ${JSON.stringify(surviving)}`)
}

// ---------------------------------------------------------------------------
// Step 8: Cleanup
// ---------------------------------------------------------------------------

async function cleanup() {
  console.log('\n8. Cleaning up...')

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
  console.log(' Seasons Feature — E2E Verification')
  console.log('═══════════════════════════════════════════════════')

  const orgId = await findOrg()
  const seasonId = await createSeason(orgId)
  const eventIds = await createEvents(orgId, seasonId)
  await verifyStats(seasonId)
  await updateSeason(seasonId)
  await reassignEvent(eventIds, seasonId)
  await deleteSeasonTest(seasonId, eventIds)
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
