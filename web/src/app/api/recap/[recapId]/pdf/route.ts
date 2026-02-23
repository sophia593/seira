import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRecapDataPublic, getSeasonRecapDataPublic, getCombinedRecapDataPublic } from '@/lib/db/recaps'
import { RecapPDF } from '@/lib/pdf/recap-pdf'
import { SeasonRecapPDF } from '@/lib/pdf/season-recap-pdf'
import { CombinedRecapPDF } from '@/lib/pdf/combined-recap-pdf'
import type { RecapData, SeasonRecapData, CombinedRecapData, Proof } from '@/lib/types/database'

type RecapProof = Proof & { uploader_name: string | null }
type AuthData =
  | { kind: 'event'; data: RecapData }
  | { kind: 'season'; data: SeasonRecapData }
  | { kind: 'combined'; data: CombinedRecapData }

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_IMAGES_PER_DELIVERABLE = 2

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeFilename(name: string): string {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_\-]/g, '')
    .slice(0, 80)
    || 'Recap'
}

function isImageMime(type: string): boolean {
  return type.startsWith('image/')
}

async function isImageReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Auth — token first, then session
// ---------------------------------------------------------------------------

async function authorizeRequest(
  request: NextRequest,
  recapId: string,
): Promise<
  | { authorized: true; authData: AuthData }
  | { authorized: false; status: number; error: string }
> {
  const token = new URL(request.url).searchParams.get('token')
  const admin = createAdminClient()

  // ── Method A: public sponsor access (token) ──────────────────────────
  if (token) {
    const { data: recap, error } = await admin
      .from('recap_reports')
      .select('id, share_token, status, season_id, is_combined')
      .eq('id', recapId)
      .single()

    if (error || !recap) {
      return { authorized: false, status: 404, error: 'Recap not found' }
    }
    if (recap.status !== 'published') {
      return { authorized: false, status: 403, error: 'Recap is not published' }
    }
    if (recap.share_token !== token) {
      return { authorized: false, status: 403, error: 'Invalid share token' }
    }

    if (recap.is_combined) {
      const data = await getCombinedRecapDataPublic(recapId)
      if (!data) return { authorized: false, status: 404, error: 'Recap data not found' }
      return { authorized: true, authData: { kind: 'combined', data } }
    }

    if (recap.season_id) {
      const data = await getSeasonRecapDataPublic(recapId)
      if (!data) return { authorized: false, status: 404, error: 'Recap data not found' }
      return { authorized: true, authData: { kind: 'season', data } }
    }

    const data = await getRecapDataPublic(recapId)
    if (!data) {
      return { authorized: false, status: 404, error: 'Recap data not found' }
    }
    return { authorized: true, authData: { kind: 'event', data } }
  }

  // ── Method B: internal portal access (session) ───────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false, status: 401, error: 'Unauthorized' }
  }

  // Fetch recap via admin (bypass RLS)
  const { data: recap, error: recapErr } = await admin
    .from('recap_reports')
    .select('id, org_id, status, season_id, is_combined')
    .eq('id', recapId)
    .single()

  if (recapErr || !recap) {
    return { authorized: false, status: 404, error: 'Recap not found' }
  }

  // Verify user belongs to the recap's org
  const { data: membership } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('org_id', recap.org_id)
    .single()

  if (!membership) {
    return { authorized: false, status: 403, error: 'Not a member of this organization' }
  }

  // Session users may access draft + published recaps
  if (recap.is_combined) {
    const data = await getCombinedRecapDataPublic(recapId)
    if (!data) return { authorized: false, status: 404, error: 'Recap data not found' }
    return { authorized: true, authData: { kind: 'combined', data } }
  }

  if (recap.season_id) {
    const data = await getSeasonRecapDataPublic(recapId)
    if (!data) return { authorized: false, status: 404, error: 'Recap data not found' }
    return { authorized: true, authData: { kind: 'season', data } }
  }

  const data = await getRecapDataPublic(recapId)
  if (!data) {
    return { authorized: false, status: 404, error: 'Recap data not found' }
  }
  return { authorized: true, authData: { kind: 'event', data } }
}

// ---------------------------------------------------------------------------
// Pre-validate proof image URLs (avoid hangs during render)
// ---------------------------------------------------------------------------

async function validateProofImages(data: RecapData): Promise<RecapData> {
  const deliverables = await Promise.all(
    data.deliverables.map(async (d) => {
      const imageProofs = d.proofs.filter((p) => isImageMime(p.file_type))
      const nonImageProofs = d.proofs.filter((p) => !isImageMime(p.file_type))

      // Limit to MAX_IMAGES_PER_DELIVERABLE
      const limited = imageProofs.slice(0, MAX_IMAGES_PER_DELIVERABLE)

      // HEAD-check each image (3 s timeout)
      const results = await Promise.all(
        limited.map(async (proof): Promise<RecapProof | null> => {
          const ok = await isImageReachable(proof.file_url)
          return ok ? proof : null
        }),
      )

      const validated = results.filter((p): p is RecapProof => p !== null)
      const anyExcluded = results.some((p) => p === null)

      const finalProofs: RecapProof[] = [...validated, ...nonImageProofs]

      // If images existed but ALL were excluded → add an "[Image unavailable]" marker
      // that renders as a non-image placeholder in the PDF.
      if (anyExcluded && validated.length === 0 && imageProofs.length > 0) {
        finalProofs.push({
          id: `unavailable-${d.id}`,
          deliverable_id: d.id,
          org_id: data.recap.org_id,
          file_url: '',
          file_name: '[Image unavailable]',
          file_type: 'application/octet-stream',
          file_size: 0,
          uploaded_by: '',
          created_at: new Date().toISOString(),
          uploader_name: null,
          validation_status: null,
          validation_result: null,
        })
      }

      return { ...d, proofs: finalProofs }
    }),
  )

  return { ...data, deliverables }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recapId: string }> },
) {
  const { recapId } = await params

  // 1. Authorize (token-first, then session)
  const auth = await authorizeRequest(request, recapId)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { authData } = auth
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // 2. Branch on recap kind
  if (authData.kind === 'combined') {
    const data = authData.data
    const shareUrl =
      data.recap.status === 'published'
        ? `${baseUrl}/recap/${data.recap.share_token}`
        : undefined

    try {
      const element = React.createElement(CombinedRecapPDF, { data, shareUrl })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buffer = await renderToBuffer(element as any)

      const filename = sanitizeFilename(
        `${data.partner.name}_Combined_Recap`,
      )

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          'Cache-Control': 'private, max-age=300',
          'X-Robots-Tag': 'noindex',
        },
      })
    } catch (err) {
      console.error('[PDF] Combined recap generation failed:', err)
      return NextResponse.json(
        {
          error: 'PDF generation failed',
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      )
    }
  }

  if (authData.kind === 'season') {
    const data = authData.data
    const shareUrl =
      data.recap.status === 'published'
        ? `${baseUrl}/recap/${data.recap.share_token}`
        : undefined

    try {
      const element = React.createElement(SeasonRecapPDF, { data, shareUrl })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buffer = await renderToBuffer(element as any)

      const filename = sanitizeFilename(
        `${data.partner.name}_${data.season.name}_Season_Recap`,
      )

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          'Cache-Control': 'private, max-age=300',
          'X-Robots-Tag': 'noindex',
        },
      })
    } catch (err) {
      console.error('[PDF] Season recap generation failed:', err)
      return NextResponse.json(
        {
          error: 'PDF generation failed',
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      )
    }
  }

  // ── Event recap (original flow) ──────────────────────────────────────
  // 3. Validate proof images (graceful degradation on failure)
  let data: RecapData
  try {
    data = await validateProofImages(authData.data)
  } catch (err) {
    console.error('[PDF] Proof validation error:', err)
    data = authData.data
  }

  // 4. Generate PDF
  const shareUrl =
    data.recap.status === 'published'
      ? `${baseUrl}/recap/${data.recap.share_token}`
      : undefined

  try {
    const element = React.createElement(RecapPDF, { data, shareUrl })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)

    const filename = sanitizeFilename(
      `${data.partner.name}_${data.event.name}_Recap`,
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'private, max-age=300',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (err) {
    console.error('[PDF] Generation failed:', err)
    return NextResponse.json(
      {
        error: 'PDF generation failed',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
