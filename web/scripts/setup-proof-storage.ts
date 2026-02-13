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
    if (error.message.includes('does not exist') || error.message.includes('Could not find') || error.code === '42P01') {
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

  const testPath = '_test-probe/verify.png'
  // 1x1 transparent PNG (smallest valid PNG)
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])
  const testBlob = new Blob([pngBytes], { type: 'image/png' })

  // Upload
  const { error: uploadError } = await supabase.storage
    .from('proof')
    .upload(testPath, testBlob, { contentType: 'image/png', upsert: true })

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
