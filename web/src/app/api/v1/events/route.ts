import { createAdminClient } from '@/lib/supabase/admin'
import { getApiAuth } from '@/lib/api-keys/auth'
import { parsePagination, apiSuccess, apiError } from '@/lib/api-keys/pagination'

export async function GET(request: Request) {
  try {
    const auth = getApiAuth(request)
    if (!auth) return apiError('UNAUTHORIZED', 'Missing authentication', 401)

    const url = new URL(request.url)
    const { limit, offset } = parsePagination(url)

    const status = url.searchParams.get('status')
    const seasonId = url.searchParams.get('season_id')

    const admin = createAdminClient()

    let countQuery = admin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', auth.orgId)

    let dataQuery = admin
      .from('events')
      .select('id, org_id, name, date, venue, status, notes, season_id, created_at, updated_at')
      .eq('org_id', auth.orgId)
      .order('date', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

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
      console.error('[API] GET /api/v1/events error:', error)
      return apiError('INTERNAL_ERROR', 'Failed to fetch events', 500)
    }

    return apiSuccess(data ?? [], count ?? 0, limit, offset)
  } catch (err) {
    console.error('[API] GET /api/v1/events unexpected error:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
