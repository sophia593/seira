'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createPartner, updatePartner, deletePartner } from '@/lib/db/partners'
import { isUuid } from '@/lib/validation'

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

  return { orgId: membership.org_id }
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

    const eventId = str(formData, 'event_id')
    if (!eventId || !isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Partner name is required' }

    const partner = await createPartner(auth.orgId, {
      event_id: eventId,
      name,
      contact_name: str(formData, 'contact_name'),
      contact_email: str(formData, 'contact_email'),
      contract_notes: str(formData, 'contract_notes'),
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)

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

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Partner name is required' }

    await updatePartner(partnerId, {
      name,
      contact_name: str(formData, 'contact_name'),
      contact_email: str(formData, 'contact_email'),
      contract_notes: str(formData, 'contract_notes'),
    })

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

    await deletePartner(partnerId)

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)

    return { ok: true }
  } catch (err) {
    console.error('deletePartnerAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete partner' }
  }
}
