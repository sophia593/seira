import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { message, org_id } = body as { message?: string; org_id?: string }

    if (!message || !org_id) {
      return NextResponse.json({ error: 'message and org_id required' }, { status: 400 })
    }

    const res = await fetch(`${API_URL}/api/v1/agents/intake/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message, org_id }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => 'Agent unavailable')
      console.error('Intake agent error:', res.status, text)
      return NextResponse.json(
        { error: 'Failed to suggest deliverables' },
        { status: res.status >= 500 ? 502 : res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json({ response: data.response })
  } catch (err) {
    console.error('POST /api/agents/intake error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
