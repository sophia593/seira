'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createPartner } from '@/lib/db/partners'
import { isUuid } from '@/lib/validation'
import { canManageContent } from '@/lib/permissions'
import { logActivity } from '@/lib/db/activity-log'
import type { OrgRole } from '@/lib/types/database'

async function getAuthenticatedOrg() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) {
    return { error: 'No organization membership' }
  }

  return { supabase, orgId: membership.org_id, role: membership.role as OrgRole, userId: user.id, userEmail: user.email ?? '' }
}

function str(formData: FormData, key: string): string | undefined {
  const val = formData.get(key)
  if (typeof val !== 'string' || val.trim() === '') return undefined
  return val.trim()
}

/**
 * Creates a partner + deliverables for ONE event.
 * Called by the client in a loop for real progress tracking.
 */
export async function batchCreateForEventAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; partnerId?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) {
      return { ok: false, error: 'You do not have permission to perform this action' }
    }

    const eventId = str(formData, 'event_id')
    if (!eventId || !isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const partnerName = str(formData, 'partner_name')
    if (!partnerName) return { ok: false, error: 'Partner name is required' }

    const deliverablesJson = str(formData, 'deliverables')
    if (!deliverablesJson) return { ok: false, error: 'Deliverables are required' }

    let deliverables: { title: string; category: string; proof_required: string; notes?: string; due_date?: string }[]
    try {
      deliverables = JSON.parse(deliverablesJson)
    } catch {
      return { ok: false, error: 'Invalid deliverables data' }
    }

    const validRows = deliverables.filter((d) => d.title?.trim())
    if (validRows.length === 0) return { ok: false, error: 'At least one deliverable is required' }

    // Create partner
    const partner = await createPartner(auth.orgId, {
      event_id: eventId,
      name: partnerName,
      contact_name: str(formData, 'contact_name'),
      contact_email: str(formData, 'contact_email'),
    })

    // Bulk insert deliverables
    const rows = validRows.map((d) => ({
      partner_id: partner.id,
      event_id: eventId,
      title: d.title.trim(),
      category: d.category,
      proof_required: d.proof_required,
      notes: d.notes ?? null,
      due_date: d.due_date ?? null,
      status: 'not_started',
    }))

    const { error: insertError } = await auth.supabase
      .from('deliverables')
      .insert(rows)

    if (insertError) {
      console.error('batchCreateForEventAction insert error:', insertError)
      return { ok: false, error: 'Failed to create deliverables' }
    }

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'batch_created', targetType: 'partner', targetId: partner.id, eventId, details: { partner_name: partnerName, deliverable_count: validRows.length, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath('/seasons')
    revalidatePath(`/events/${eventId}`)

    return { ok: true, partnerId: partner.id }
  } catch (err) {
    console.error('batchCreateForEventAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create batch' }
  }
}
