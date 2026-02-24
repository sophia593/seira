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
    const seasonId = url.searchParams.get('season_id')

    const admin = createAdminClient()

    let countQuery = admin
      .from('recap_reports')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', auth.orgId)

    let dataQuery = admin
      .from('recap_reports')
      .select('id, org_id, event_id, partner_id, share_token, title, status, cover_note, published_at, season_id, partner_name, is_combined, created_at, updated_at')
      .eq('org_id', auth.orgId)
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
    if (seasonId) {
      countQuery = countQuery.eq('season_id', seasonId)
      dataQuery = dataQuery.eq('season_id', seasonId)
    }

    const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery])

    if (error) {
      console.error('[API] GET /api/v1/recaps error:', error)
      return apiError('INTERNAL_ERROR', 'Failed to fetch recaps', 500)
    }

    return apiSuccess(data ?? [], count ?? 0, limit, offset)
  } catch (err) {
    console.error('[API] GET /api/v1/recaps unexpected error:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
