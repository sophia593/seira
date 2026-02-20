import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listPartnersForExport } from '@/lib/db/partners'
import { buildCsv } from '@/lib/csv'
import { isUuid } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    // Parse filters
    const params = request.nextUrl.searchParams
    const filters: Record<string, string> = {}

    const eventParam = params.get('event')
    if (eventParam && isUuid(eventParam)) filters.eventId = eventParam

    const seasonParam = params.get('season')
    if (seasonParam && isUuid(seasonParam)) filters.seasonId = seasonParam

    const rows = await listPartnersForExport(membership.org_id, filters)

    const headers = [
      'Partner',
      'Contact Name',
      'Contact Email',
      'Event',
      'Deal Summary',
      'Deliverables',
      'Completed',
      'Proved',
      'Overdue',
      'Completion %',
    ]

    const csvRows = rows.map((row) => [
      row.partner_name,
      row.contact_name,
      row.contact_email,
      row.event_name,
      row.contract_notes,
      String(row.total),
      String(row.completed),
      String(row.proved),
      String(row.overdue),
      `${row.completion_pct}%`,
    ])

    const csv = buildCsv(headers, csvRows)

    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `Partners_${dateStr}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (err) {
    console.error('[Partner CSV Export] Error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
