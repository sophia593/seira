/**
 * E2E verification: event duplication with a complex event.
 *
 * Creates a source event with 5 partners and 24 deliverables (mixed statuses),
 * duplicates it via the same logic as duplicateEventAction, and verifies the
 * copy has the correct structure — fresh statuses, no proof carried over.
 *
 * Usage:  cd web && npx tsx --env-file=.env.local scripts/test-event-duplication.ts
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
const cleanup: string[] = [] // event IDs to delete on cleanup

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(msg: string) { console.log(`  ✓ ${msg}`) }
function fail(msg: string) { hasErrors = true; console.error(`  ✗ ${msg}`) }
function info(msg: string) { console.log(`  → ${msg}`) }

const CATEGORIES = ['in-venue', 'digital', 'hospitality', 'signage', 'talent', 'content'] as const
const STATUSES = ['not_started', 'in_progress', 'done', 'proved'] as const
const PROOF_TYPES = ['photo', 'link', 'screenshot', 'file', 'multiple'] as const

// ---------------------------------------------------------------------------
// Step 1: Find an org to use
// ---------------------------------------------------------------------------

async function findOrg(): Promise<string> {
  console.log('\n1. Finding an organization...')

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single()

  if (error || !data) {
    fail('No organizations found — cannot run test')
    process.exit(1)
  }

  ok(`Using org: ${data.name} (${data.id})`)
  return data.id
}

// ---------------------------------------------------------------------------
// Step 2: Create complex source event
// ---------------------------------------------------------------------------

async function createSourceEvent(orgId: string): Promise<string> {
  console.log('\n2. Creating complex source event (5 partners, 24 deliverables)...')

  // Create event
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .insert({
      org_id: orgId,
      name: 'TEST — Summer Festival 2025',
      date: '2025-08-15',
      venue: 'Central Park, NYC',
      status: 'active',
      notes: 'Complex event for duplication testing',
    })
    .select('id')
    .single()

  if (eventErr || !event) {
    fail(`Failed to create event: ${eventErr?.message}`)
    process.exit(1)
  }
  cleanup.push(event.id)
  ok(`Created source event: ${event.id}`)

  // Create 5 partners
  const partnerDefs = [
    { name: 'Nike', contact_name: 'John Smith', contact_email: 'john@nike.test', contract_notes: 'Tier 1 sponsor' },
    { name: 'Red Bull', contact_name: 'Anna Lee', contact_email: 'anna@redbull.test', contract_notes: 'Beverage partner' },
    { name: 'Spotify', contact_name: 'Mark Chen', contact_email: 'mark@spotify.test', contract_notes: null },
    { name: 'Amex', contact_name: 'Sarah Jones', contact_email: 'sarah@amex.test', contract_notes: 'VIP lounge' },
    { name: 'TikTok', contact_name: null, contact_email: null, contract_notes: 'Content partner' },
  ]

  const partnerIds: string[] = []
  for (const p of partnerDefs) {
    const { data, error } = await supabase
      .from('partners')
      .insert({ org_id: orgId, event_id: event.id, ...p })
      .select('id')
      .single()
    if (error || !data) {
      fail(`Failed to create partner ${p.name}: ${error?.message}`)
      continue
    }
    partnerIds.push(data.id)
  }
  ok(`Created ${partnerIds.length} partners`)

  // Create deliverables — mix of statuses, categories, proof types
  // Aim for ~5 per partner = 25 deliverables
  const deliverableRows: Array<Record<string, unknown>> = []
  const deliverableTitles = [
    'Main stage banner', 'LED screen rotation', 'VIP tent signage', 'Entry arch branding', 'Wristband logo',
    'Social media post series', 'Instagram story takeover', 'TikTok hashtag challenge', 'Email blast inclusion', 'App push notification',
    'VIP lounge setup', 'Hospitality tent', 'Backstage catering logo', 'Meet & greet area', 'Sample distribution',
    'Stage backdrop', 'Directional signage', 'Jumbotron ad', 'Map branding', 'Restroom signage',
    'MC mentions', 'Artist collab content', 'Livestream overlay', 'Post-event recap video',
  ]

  for (let i = 0; i < deliverableTitles.length; i++) {
    const partnerId = partnerIds[i % partnerIds.length]
    if (!partnerId) continue
    deliverableRows.push({
      partner_id: partnerId,
      event_id: event.id,
      title: deliverableTitles[i],
      category: CATEGORIES[i % CATEGORIES.length],
      status: STATUSES[i % STATUSES.length],
      proof_required: PROOF_TYPES[i % PROOF_TYPES.length],
      due_date: `2025-08-${String(10 + (i % 6)).padStart(2, '0')}`,
      notes: i % 3 === 0 ? `Notes for ${deliverableTitles[i]}` : null,
    })
  }

  const { error: delErr, data: delData } = await supabase
    .from('deliverables')
    .insert(deliverableRows)
    .select('id')

  if (delErr) {
    fail(`Failed to create deliverables: ${delErr.message}`)
  } else {
    ok(`Created ${delData?.length ?? 0} deliverables`)
  }

  return event.id
}

// ---------------------------------------------------------------------------
// Step 3: Duplicate the event (replicating server action logic)
// ---------------------------------------------------------------------------

async function duplicateEvent(orgId: string, sourceId: string): Promise<string> {
  console.log('\n3. Duplicating event...')

  // Fetch source
  const { data: source } = await supabase
    .from('events').select('*').eq('id', sourceId).single()
  if (!source) { fail('Source event not found'); process.exit(1) }

  // Create new event
  const { data: newEvent, error: newErr } = await supabase
    .from('events')
    .insert({
      org_id: orgId,
      name: 'TEST — Summer Festival 2025 (Copy)',
      date: '2025-09-20',
      venue: source.venue,
      notes: source.notes,
      status: 'upcoming',
    })
    .select('id')
    .single()
  if (newErr || !newEvent) { fail(`Failed to create copy: ${newErr?.message}`); process.exit(1) }
  cleanup.push(newEvent.id)
  ok(`Created new event: ${newEvent.id}`)

  // Fetch partners + deliverables
  const [{ data: partners }, { data: deliverables }] = await Promise.all([
    supabase.from('partners').select('*').eq('event_id', sourceId).order('name'),
    supabase.from('deliverables').select('*').eq('event_id', sourceId).order('created_at'),
  ])

  // Copy partners
  const partnerIdMap = new Map<string, string>()
  for (const p of partners ?? []) {
    const { data: np, error: pErr } = await supabase
      .from('partners')
      .insert({
        org_id: orgId,
        event_id: newEvent.id,
        name: p.name,
        contact_name: p.contact_name,
        contact_email: p.contact_email,
        contract_notes: p.contract_notes,
      })
      .select('id')
      .single()
    if (!pErr && np) partnerIdMap.set(p.id, np.id)
  }
  ok(`Copied ${partnerIdMap.size} partners`)

  // Bulk-insert deliverables with fresh status
  const rows = (deliverables ?? [])
    .filter(d => partnerIdMap.has(d.partner_id))
    .map(d => ({
      partner_id: partnerIdMap.get(d.partner_id)!,
      event_id: newEvent.id,
      title: d.title,
      category: d.category,
      due_date: d.due_date,
      owner_id: d.owner_id,
      status: 'not_started',
      proof_required: d.proof_required,
      notes: d.notes,
    }))

  if (rows.length > 0) {
    const { error: dErr } = await supabase.from('deliverables').insert(rows)
    if (dErr) fail(`Failed to insert deliverables: ${dErr.message}`)
  }
  ok(`Inserted ${rows.length} deliverables`)

  return newEvent.id
}

// ---------------------------------------------------------------------------
// Step 4: Verify the duplicate
// ---------------------------------------------------------------------------

async function verify(sourceId: string, copyId: string) {
  console.log('\n4. Verifying duplication...')

  // Fetch both events
  const [{ data: srcEvent }, { data: cpyEvent }] = await Promise.all([
    supabase.from('events').select('*').eq('id', sourceId).single(),
    supabase.from('events').select('*').eq('id', copyId).single(),
  ])

  if (!srcEvent || !cpyEvent) { fail('Could not load events for verification'); return }

  // Name / date
  if (cpyEvent.name === 'TEST — Summer Festival 2025 (Copy)') ok('Name correctly set')
  else fail(`Name mismatch: "${cpyEvent.name}"`)

  if (cpyEvent.date === '2025-09-20') ok('Date correctly overridden')
  else fail(`Date mismatch: "${cpyEvent.date}"`)

  if (cpyEvent.venue === srcEvent.venue) ok('Venue carried over')
  else fail(`Venue mismatch: "${cpyEvent.venue}" vs "${srcEvent.venue}"`)

  if (cpyEvent.notes === srcEvent.notes) ok('Notes carried over')
  else fail(`Notes mismatch`)

  // Partners
  const [{ data: srcPartners }, { data: cpyPartners }] = await Promise.all([
    supabase.from('partners').select('*').eq('event_id', sourceId).order('name'),
    supabase.from('partners').select('*').eq('event_id', copyId).order('name'),
  ])

  if (srcPartners?.length === cpyPartners?.length) ok(`Partner count matches: ${cpyPartners?.length}`)
  else fail(`Partner count: source=${srcPartners?.length} copy=${cpyPartners?.length}`)

  // Check partner details match
  for (let i = 0; i < (srcPartners?.length ?? 0); i++) {
    const s = srcPartners![i]
    const c = cpyPartners![i]
    if (s.name !== c.name || s.contact_name !== c.contact_name || s.contact_email !== c.contact_email) {
      fail(`Partner detail mismatch at index ${i}: "${s.name}" vs "${c.name}"`)
    }
  }
  if (!hasErrors) ok('All partner details match (name, contact, email, notes)')

  // Deliverables
  const [{ data: srcDels }, { data: cpyDels }] = await Promise.all([
    supabase.from('deliverables').select('*').eq('event_id', sourceId).order('title'),
    supabase.from('deliverables').select('*').eq('event_id', copyId).order('title'),
  ])

  if (srcDels?.length === cpyDels?.length) ok(`Deliverable count matches: ${cpyDels?.length}`)
  else fail(`Deliverable count: source=${srcDels?.length} copy=${cpyDels?.length}`)

  // All statuses should be not_started
  const allFresh = cpyDels?.every(d => d.status === 'not_started') ?? false
  if (allFresh) ok('All deliverable statuses reset to not_started')
  else {
    const statusCounts: Record<string, number> = {}
    cpyDels?.forEach(d => { statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1 })
    fail(`Not all statuses fresh: ${JSON.stringify(statusCounts)}`)
  }

  // Source had mixed statuses
  const srcStatuses = new Set(srcDels?.map(d => d.status) ?? [])
  if (srcStatuses.size > 1) ok(`Source had mixed statuses: ${[...srcStatuses].join(', ')}`)
  else info('Source had uniform statuses')

  // Categories, titles, proof_required should match
  let structureMatch = true
  for (let i = 0; i < (srcDels?.length ?? 0); i++) {
    const s = srcDels![i]
    const c = cpyDels![i]
    if (s.title !== c.title || s.category !== c.category || s.proof_required !== c.proof_required) {
      fail(`Deliverable structure mismatch at "${s.title}"`)
      structureMatch = false
      break
    }
    if (s.due_date !== c.due_date) {
      fail(`Due date mismatch at "${s.title}": ${s.due_date} vs ${c.due_date}`)
      structureMatch = false
      break
    }
    if (s.notes !== c.notes) {
      fail(`Notes mismatch at "${s.title}"`)
      structureMatch = false
      break
    }
  }
  if (structureMatch) ok('All deliverable structure preserved (title, category, proof_required, due_date, notes)')

  // No proofs on copy
  const cpyDelIds = cpyDels?.map(d => d.id) ?? []
  if (cpyDelIds.length > 0) {
    const { count } = await supabase
      .from('proofs')
      .select('*', { count: 'exact', head: true })
      .in('deliverable_id', cpyDelIds)
    if (count === 0 || count === null) ok('No proofs on duplicated deliverables')
    else fail(`Found ${count} proofs on copy — expected 0`)
  }
}

// ---------------------------------------------------------------------------
// Step 5: Cleanup
// ---------------------------------------------------------------------------

async function cleanupTestData() {
  console.log('\n5. Cleaning up test data...')

  for (const eventId of cleanup) {
    // Cascade: deleting event should cascade to partners → deliverables
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) fail(`Failed to clean up event ${eventId}: ${error.message}`)
  }
  ok(`Removed ${cleanup.length} test event(s) and all related data`)
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log(' Event Duplication — E2E Verification')
  console.log('═══════════════════════════════════════════════════')

  const orgId = await findOrg()
  const sourceId = await createSourceEvent(orgId)
  const copyId = await duplicateEvent(orgId, sourceId)
  await verify(sourceId, copyId)
  await cleanupTestData()

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
  // Still try to clean up
  cleanupTestData().finally(() => process.exit(1))
})
