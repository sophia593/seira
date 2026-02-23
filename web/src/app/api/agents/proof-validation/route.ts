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
    const { proof_id, org_id } = body as { proof_id?: string; org_id?: string }

    if (!proof_id || !org_id) {
      return NextResponse.json({ error: 'proof_id and org_id required' }, { status: 400 })
    }

    const res = await fetch(`${API_URL}/api/v1/agents/proof-validation/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ proof_id, org_id }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => 'Agent unavailable')
      console.error('Proof validation agent error:', res.status, text)
      return NextResponse.json(
        { error: 'Failed to validate proof' },
        { status: res.status >= 500 ? 502 : res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json({ result: data.result })
  } catch (err) {
    console.error('POST /api/agents/proof-validation error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
