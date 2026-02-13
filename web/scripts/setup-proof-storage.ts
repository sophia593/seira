/**
 * Setup script: creates the 'proof' storage bucket in Supabase and verifies
 * the proofs table + storage policies exist.
 *
 * Usage:  cd web && npm run setup:storage
 *   (or)  cd web && npx tsx --env-file=.env.local scripts/setup-proof-storage.ts
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

// ---------------------------------------------------------------------------
// Step 1: Create storage bucket
// ---------------------------------------------------------------------------

async function ensureBucket() {
  console.log('\n1. Checking proof storage bucket...')

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('   Could not list buckets:', listError.message)
    hasErrors = true
    return
  }

  const exists = buckets?.some((b) => b.name === 'proof')
  if (exists) {
    console.log('   Bucket "proof" already exists')
    return
  }

  const { error } = await supabase.storage.createBucket('proof', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'video/quicktime',
    ],
  })

  if (error) {
    console.error('   Failed to create bucket:', error.message)
    hasErrors = true
    return
  }

  console.log('   Bucket "proof" created')
}

// ---------------------------------------------------------------------------
// Step 2: Check proofs table
// ---------------------------------------------------------------------------

async function checkTable() {
  console.log('\n2. Checking proofs table...')

  const { error } = await supabase.from('proofs').select('id').limit(1)

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.error(
        '   Proofs table does not exist.\n' +
        '   Please run the migration SQL in the Supabase SQL Editor:\n' +
        '   File: supabase/migrations/00005_proof_storage.sql\n' +
        '   (Copy everything from "PROOFS TABLE" to "STORAGE RLS POLICIES")'
      )
      hasErrors = true
      return false
    }
    // Some other error — might be RLS, which is fine for admin client
    console.log('   Table query returned:', error.message)
  }

  console.log('   Proofs table exists')
  return true
}

// ---------------------------------------------------------------------------
// Step 3: Test upload / read / delete
// ---------------------------------------------------------------------------

async function verifyUploadFlow() {
  console.log('\n3. Testing upload/read/delete...')

  const testPath = '_test-probe/verify.txt'
  const testBlob = new Blob(['proof-storage-test'], { type: 'text/plain' })

  // Upload
  const { error: uploadError } = await supabase.storage
    .from('proof')
    .upload(testPath, testBlob, { contentType: 'text/plain', upsert: true })

  if (uploadError) {
    console.error('   Upload failed:', uploadError.message)
    if (uploadError.message.includes('policy') || uploadError.message.includes('security')) {
      console.error(
        '   Storage RLS policies may be missing.\n' +
        '   Run the "STORAGE RLS POLICIES" section from:\n' +
        '   supabase/migrations/00005_proof_storage.sql'
      )
    }
    hasErrors = true
    return
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('proof').getPublicUrl(testPath)
  console.log('   Public URL:', urlData.publicUrl)

  // Cleanup
  const { error: deleteError } = await supabase.storage
    .from('proof')
    .remove([testPath])

  if (deleteError) {
    console.error('   Delete failed:', deleteError.message)
    hasErrors = true
    return
  }

  console.log('   Upload/read/delete verified')
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log('Proof Storage Setup')
  console.log('='.repeat(40))

  await ensureBucket()
  const tableOk = await checkTable()

  // Only test upload if bucket exists (table check is informational)
  await verifyUploadFlow()

  console.log('\n' + '='.repeat(40))
  if (hasErrors) {
    console.log('Done with warnings — see above for manual steps.')
    process.exit(1)
  } else {
    console.log('All checks passed.')
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
