/**
 * Setup script: checks for the recap_reports table and prints the migration
 * SQL if it's missing so you can paste it into the Supabase SQL Editor.
 *
 * Usage:  cd web && npx tsx --env-file=.env.local scripts/setup-recap-table.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log('Recap Reports Table Setup')
  console.log('='.repeat(40))

  // Check if table already exists
  console.log('\n1. Checking if recap_reports table exists...')
  const { error: probeError } = await supabase
    .from('recap_reports')
    .select('id')
    .limit(1)

  if (!probeError) {
    console.log('   Table already exists — nothing to do.')
    console.log('\n' + '='.repeat(40))
    console.log('All good.')
    return
  }

  const msg = probeError.message?.toLowerCase() ?? ''
  const isMissing =
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    probeError.code === '42P01'

  if (!isMissing) {
    // Some other error (e.g. empty result) — table probably exists
    console.log('   Table likely exists (got non-missing error):', probeError.message)
    console.log('\n' + '='.repeat(40))
    console.log('All good.')
    return
  }

  console.log('   Table does not exist.')
  console.log('\n   The Supabase JS client cannot run raw DDL SQL.')
  console.log('   Please run the migration manually:\n')

  const sqlPath = resolve(__dirname, '../../supabase/migrations/00006_recap_reports.sql')
  try {
    const sql = readFileSync(sqlPath, 'utf-8')
    console.log('='.repeat(60))
    console.log('Paste this into the Supabase SQL Editor and click Run:')
    console.log('='.repeat(60))
    console.log('\n' + sql)
    console.log('='.repeat(60))
  } catch {
    console.log('   Could not read the SQL file at:', sqlPath)
    console.log('   Open: supabase/migrations/00006_recap_reports.sql')
    console.log('   Copy the entire file into the Supabase SQL Editor and run it.')
  }

  process.exit(1)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
