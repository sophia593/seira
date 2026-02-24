'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createPartner, updatePartner, deletePartner } from '@/lib/db/partners'
import { isUuid } from '@/lib/validation'
import { canManageContent } from '@/lib/permissions'
import { logActivity } from '@/lib/db/activity-log'
import { fireWebhook } from '@/lib/webhooks/dispatch'
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

export async function createPartnerAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const eventId = str(formData, 'event_id')
    if (!eventId || !isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Partner name is required' }

    const dealValueStr = str(formData, 'deal_value')
    const dealValueNum = dealValueStr ? parseInt(dealValueStr, 10) : undefined
    const renewalDate = str(formData, 'renewal_date')

    const partner = await createPartner(auth.orgId, {
      event_id: eventId,
      name,
      contact_name: str(formData, 'contact_name'),
      contact_email: str(formData, 'contact_email'),
      contract_notes: str(formData, 'contract_notes'),
      deal_value: dealValueNum != null && !isNaN(dealValueNum) ? dealValueNum : undefined,
      renewal_date: renewalDate,
    })

    // Insert deliverables if provided (from template or manually added)
    const deliverablesJson = str(formData, 'deliverables')
    if (deliverablesJson) {
      try {
        const deliverables = JSON.parse(deliverablesJson) as { title: string; category: string; proof_required: string }[]
        const validRows = deliverables
          .filter((d) => d.title?.trim())
          .map((d) => ({
            partner_id: partner.id,
            event_id: eventId,
            title: d.title.trim(),
            category: d.category,
            proof_required: d.proof_required,
            notes: null,
            status: 'not_started',
          }))
        if (validRows.length > 0) {
          await auth.supabase.from('deliverables').insert(validRows)
        }
      } catch (err) {
        console.error('createPartnerAction deliverables error:', err)
        // Non-fatal — partner was created, deliverables just weren't seeded
      }
    }

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'created', targetType: 'partner', targetId: partner.id, eventId, details: { name, actor_email: auth.userEmail } })

    fireWebhook('partner_added', auth.orgId, {
      partner_id: partner.id,
      event_id: eventId,
      name: partner.name,
      contact_name: partner.contact_name,
      contact_email: partner.contact_email,
      deal_value: partner.deal_value,
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partner.id}`)

    return { ok: true, id: partner.id }
  } catch (err) {
    console.error('createPartnerAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create partner' }
  }
}

export async function updatePartnerAction(
  partnerId: string,
  eventId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Partner name is required' }

    const dealValueStr = str(formData, 'deal_value')
    const dealValueNum = dealValueStr ? parseInt(dealValueStr, 10) : undefined
    const renewalDate = str(formData, 'renewal_date')

    await updatePartner(partnerId, {
      name,
      contact_name: str(formData, 'contact_name'),
      contact_email: str(formData, 'contact_email'),
      contract_notes: str(formData, 'contract_notes'),
      deal_value: dealValueNum != null && !isNaN(dealValueNum) ? dealValueNum : undefined,
      renewal_date: renewalDate,
    })

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'updated', targetType: 'partner', targetId: partnerId, eventId, details: { name, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true }
  } catch (err) {
    console.error('updatePartnerAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update partner' }
  }
}

export async function deletePartnerAction(
  partnerId: string,
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    await deletePartner(partnerId)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'deleted', targetType: 'partner', targetId: partnerId, eventId, details: { actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)

    return { ok: true }
  } catch (err) {
    console.error('deletePartnerAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete partner' }
  }
}
