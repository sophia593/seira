import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listNotifications } from '@/lib/db/notifications'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)

    if (!orgId) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 })
    }

    const notifications = await listNotifications(supabase, user.id, orgId, { limit })

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error('GET /api/notifications error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
