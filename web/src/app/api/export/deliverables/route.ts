import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { listDeliverablesForExport } from '@/lib/db/deliverables'
import { countProofByDeliverable } from '@/lib/db/proof'
import { CATEGORIES, STATUS_FLOW, CATEGORY_CONFIG, STATUS_CONFIG, PROOF_REQUIRED_CONFIG } from '@/lib/constants'
import { buildCsv } from '@/lib/csv'
import { isUuid } from '@/lib/validation'
import type { DeliverableCategory, DeliverableStatus, ProofRequired } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 })

    // Parse filters from query params
    const params = request.nextUrl.searchParams
    const filters: Record<string, string> = {}

    const eventParam = params.get('event')
    if (eventParam && isUuid(eventParam)) filters.eventId = eventParam

    const seasonParam = params.get('season')
    if (seasonParam && isUuid(seasonParam)) filters.seasonId = seasonParam

    const partnerParam = params.get('partner')
    if (partnerParam && partnerParam.length > 0) filters.partnerName = partnerParam

    const categoryParam = params.get('category')
    if (categoryParam && (CATEGORIES as string[]).includes(categoryParam)) filters.category = categoryParam

    const statusParam = params.get('status')
    if (statusParam && (STATUS_FLOW as string[]).includes(statusParam)) filters.status = statusParam

    // Query deliverables
    const rows = await listDeliverablesForExport(membership.org_id, filters)

    // Get proof counts
    const proofCounts = rows.length > 0
      ? await countProofByDeliverable(rows.map((r) => r.id))
      : {}

    // Build CSV
    const headers = ['Event', 'Partner', 'Title', 'Category', 'Status', 'Due Date', 'Proof Required', 'Notes', 'Proof Count']
    const csvRows = rows.map((row) => [
      row.event_name,
      row.partner_name,
      row.title,
      CATEGORY_CONFIG[row.category as DeliverableCategory]?.label ?? row.category,
      STATUS_CONFIG[row.status as DeliverableStatus]?.label ?? row.status,
      formatDate(row.due_date),
      PROOF_REQUIRED_CONFIG[row.proof_required as ProofRequired]?.label ?? row.proof_required,
      row.notes,
      String(proofCounts[row.id] ?? 0),
    ])

    const csv = buildCsv(headers, csvRows)

    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `Deliverables_${dateStr}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (err) {
    console.error('[CSV Export] Error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
