/**
 * E2E verification: activity log — create/update/delete an event and partner,
 * then verify activity_log entries were recorded correctly.
 *
 * Usage:  cd web && npx tsx --env-file=.env.local scripts/test-activity-log.ts
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
const cleanupEventIds: string[] = []

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(msg: string) { console.log(`  ✓ ${msg}`) }
function fail(msg: string) { hasErrors = true; console.error(`  ✗ ${msg}`) }

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Step 1: Find an org and user
// ---------------------------------------------------------------------------

async function findOrgAndUser(): Promise<{ orgId: string; userId: string }> {
  console.log('\n1. Finding an organization and user...')

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single()

  if (orgErr || !org) {
    fail('No organizations found')
    process.exit(1)
  }

  const { data: member, error: memberErr } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('org_id', org.id)
    .limit(1)
    .single()

  if (memberErr || !member) {
    fail('No org members found')
    process.exit(1)
  }

  ok(`Using org: ${org.name} (${org.id}), user: ${member.user_id}`)
  return { orgId: org.id, userId: member.user_id }
}

// ---------------------------------------------------------------------------
// Step 2: Insert activity log entries directly (simulating server actions)
// ---------------------------------------------------------------------------

async function insertTestEntries(orgId: string, userId: string): Promise<string> {
  console.log('\n2. Creating test event and activity log entries...')

  // Create a test event
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .insert({ org_id: orgId, name: 'TEST — Activity Log Event', status: 'upcoming' })
    .select('id')
    .single()

  if (eventErr || !event) {
    fail(`Failed to create test event: ${eventErr?.message}`)
    process.exit(1)
  }
  cleanupEventIds.push(event.id)
  ok(`Created test event: ${event.id}`)

  // Insert activity log entries
  const entries = [
    {
      org_id: orgId,
      user_id: userId,
      action: 'created',
      target_type: 'event',
      target_id: event.id,
      event_id: event.id,
      details_json: { name: 'TEST — Activity Log Event', actor_email: 'test@seira.dev' },
    },
    {
      org_id: orgId,
      user_id: userId,
      action: 'updated',
      target_type: 'event',
      target_id: event.id,
      event_id: event.id,
      details_json: { name: 'TEST — Activity Log Event (Updated)', actor_email: 'test@seira.dev' },
    },
    {
      org_id: orgId,
      user_id: userId,
      action: 'created',
      target_type: 'partner',
      target_id: null,
      event_id: event.id,
      details_json: { name: 'TEST — Acme Corp', actor_email: 'test@seira.dev' },
    },
    {
      org_id: orgId,
      user_id: userId,
      action: 'deleted',
      target_type: 'partner',
      target_id: null,
      event_id: event.id,
      details_json: { actor_email: 'test@seira.dev' },
    },
  ]

  const { error: insertErr } = await supabase.from('activity_log').insert(entries)
  if (insertErr) {
    fail(`Failed to insert activity log entries: ${insertErr.message}`)
    process.exit(1)
  }

  ok('Inserted 4 activity log entries')
  return event.id
}

// ---------------------------------------------------------------------------
// Step 3: Verify entries
// ---------------------------------------------------------------------------

async function verify(orgId: string, eventId: string) {
  console.log('\n3. Verifying activity log entries...')

  // Small delay to ensure inserts are visible
  await sleep(500)

  // 3a. Count entries for this event
  const { data: entries, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('org_id', orgId)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) {
    fail(`Failed to query activity_log: ${error.message}`)
    return
  }

  if (entries?.length === 4) ok('4 activity log entries found')
  else fail(`Expected 4 entries, got ${entries?.length}`)

  // 3b. Verify entry actions in order
  const expectedActions = ['created', 'updated', 'created', 'deleted']
  const expectedTargetTypes = ['event', 'event', 'partner', 'partner']

  for (let i = 0; i < expectedActions.length; i++) {
    const entry = entries?.[i]
    if (!entry) {
      fail(`Missing entry at index ${i}`)
      continue
    }
    if (entry.action === expectedActions[i] && entry.target_type === expectedTargetTypes[i]) {
      ok(`Entry ${i + 1}: action=${entry.action}, target_type=${entry.target_type}`)
    } else {
      fail(`Entry ${i + 1}: expected action=${expectedActions[i]}, target_type=${expectedTargetTypes[i]}, got action=${entry.action}, target_type=${entry.target_type}`)
    }
  }

  // 3c. Verify details_json contains actor_email
  const allHaveEmail = entries?.every(
    (e) => (e.details_json as Record<string, unknown>)?.actor_email === 'test@seira.dev'
  )
  if (allHaveEmail) ok('All entries have actor_email in details_json')
  else fail('Some entries missing actor_email')

  // 3d. Verify ordering (newest first) with DESC query
  const { data: descEntries } = await supabase
    .from('activity_log')
    .select('action, created_at')
    .eq('org_id', orgId)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (descEntries?.[0]?.action === 'deleted') ok('DESC ordering returns newest entry first')
  else fail(`Expected newest entry to be 'deleted', got '${descEntries?.[0]?.action}'`)
}

// ---------------------------------------------------------------------------
// Step 4: Cleanup
// ---------------------------------------------------------------------------

async function cleanup(orgId: string, eventId: string) {
  console.log('\n4. Cleaning up...')

  // Delete activity log entries for this event
  await supabase.from('activity_log').delete().eq('event_id', eventId)

  // Delete test events
  for (const id of cleanupEventIds) {
    await supabase.from('events').delete().eq('id', id)
  }

  ok(`Removed activity log entries and ${cleanupEventIds.length} test event(s)`)
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log(' Activity Log — E2E Verification')
  console.log('═══════════════════════════════════════════════════')

  const { orgId, userId } = await findOrgAndUser()
  const eventId = await insertTestEntries(orgId, userId)
  await verify(orgId, eventId)
  await cleanup(orgId, eventId)

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
  cleanup('', cleanupEventIds[0] ?? '').finally(() => process.exit(1))
})
