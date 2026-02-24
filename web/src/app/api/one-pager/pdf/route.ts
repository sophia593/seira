import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { OnePagerPDF } from '@/lib/pdf/one-pager-pdf'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const screenshotUrl = process.env.ONE_PAGER_SCREENSHOT_URL || undefined

    const element = React.createElement(OnePagerPDF, { screenshotUrl })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Seira_One_Pager.pdf"',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err) {
    console.error('[PDF] One-pager generation failed:', err)
    return NextResponse.json(
      {
        error: 'PDF generation failed',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
