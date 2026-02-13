import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRecapById, getRecapData, getRecapDataPublic } from '@/lib/db/recaps'
import { RecapPDF } from '@/lib/pdf/recap-pdf'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '')
    || 'recap'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recapId: string }> }
) {
  const { recapId } = await params
  const token = request.nextUrl.searchParams.get('token')

  let data

  if (token) {
    // Public access via share token — verify the recap is published and token matches
    const admin = createAdminClient()
    const { data: recap, error } = await admin
      .from('recap_reports')
      .select('id, share_token, status')
      .eq('id', recapId)
      .single()

    if (error || !recap || recap.status !== 'published' || recap.share_token !== token) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    data = await getRecapDataPublic(recapId)
  } else {
    // Authenticated access — check session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recap = await getRecapById(recapId)
    if (!recap) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    data = await getRecapData(recapId)
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Build share URL for the PDF footer
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const shareUrl = data.recap.status === 'published'
    ? `${baseUrl}/recap/${data.recap.share_token}`
    : undefined

  try {
    const element = React.createElement(RecapPDF, { data, shareUrl })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)

    const filename = sanitizeFilename(
      `${data.partner.name} - ${data.event.name} Recap`
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[PDF] Generation failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
