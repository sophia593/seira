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

    const admin = createAdminClient()

    let countQuery = admin
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', auth.orgId)

    let dataQuery = admin
      .from('partners')
      .select('id, org_id, event_id, name, contact_name, contact_email, contract_notes, deal_value, renewal_date, created_at, updated_at')
      .eq('org_id', auth.orgId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (eventId) {
      countQuery = countQuery.eq('event_id', eventId)
      dataQuery = dataQuery.eq('event_id', eventId)
    }

    const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery])

    if (error) {
      console.error('[API] GET /api/v1/partners error:', error)
      return apiError('INTERNAL_ERROR', 'Failed to fetch partners', 500)
    }

    return apiSuccess(data ?? [], count ?? 0, limit, offset)
  } catch (err) {
    console.error('[API] GET /api/v1/partners unexpected error:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
