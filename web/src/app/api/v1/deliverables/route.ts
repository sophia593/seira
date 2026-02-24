import { createAdminClient } from '@/lib/supabase/admin'
import { getApiAuth } from '@/lib/api-keys/auth'
import { parsePagination, apiSuccess, apiError } from '@/lib/api-keys/pagination'

export async function GET(request: Request) {
  try {
    const auth = getApiAuth(request)
    if (!auth) return apiError('UNAUTHORIZED', 'Missing authentication', 401)

    const url = new URL(request.url)
    const { limit, offset } = parsePagination(url)

    const eventId = url.searchParams.get('event_id')
    const partnerId = url.searchParams.get('partner_id')
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')

    const admin = createAdminClient()

    // Deliverables don't have org_id directly — scope via events table
    let countQuery = admin
      .from('deliverables')
      .select('id, events!inner(org_id)', { count: 'exact', head: true })
      .eq('events.org_id', auth.orgId)

    let dataQuery = admin
      .from('deliverables')
      .select('id, partner_id, event_id, title, category, due_date, owner_id, status, proof_required, notes, created_at, updated_at, events!inner(org_id)')
      .eq('events.org_id', auth.orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (eventId) {
      countQuery = countQuery.eq('event_id', eventId)
      dataQuery = dataQuery.eq('event_id', eventId)
    }
    if (partnerId) {
      countQuery = countQuery.eq('partner_id', partnerId)
      dataQuery = dataQuery.eq('partner_id', partnerId)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
    }
    if (category) {
      countQuery = countQuery.eq('category', category)
      dataQuery = dataQuery.eq('category', category)
    }

    const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery])

    if (error) {
      console.error('[API] GET /api/v1/deliverables error:', error)
      return apiError('INTERNAL_ERROR', 'Failed to fetch deliverables', 500)
    }

    // Strip the nested events join from the response
    const cleaned = (data ?? []).map(({ events: _events, ...rest }) => rest)

    return apiSuccess(cleaned, count ?? 0, limit, offset)
  } catch (err) {
    console.error('[API] GET /api/v1/deliverables unexpected error:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
