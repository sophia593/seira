'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { canManageRecaps } from '@/lib/permissions'
import { getEventById } from '@/lib/db/events'
import { getPartnerById } from '@/lib/db/partners'
import {
  createRecap,
  updateRecap,
  publishRecap,
  deleteRecap,
} from '@/lib/db/recaps'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { notifyOrgAdmins } from '@/lib/db/notifications'
import { getOrganization } from '@/lib/db/organizations'
import { isUuid } from '@/lib/validation'
import { sendEmail } from '@/lib/email/send'
import { recapSharedEmailSubject, recapSharedEmailHtml } from '@/lib/email/templates/recap-shared'
import type { OrgRole } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getAuthenticatedOrg() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' as const }
  }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) {
    return { error: 'No organization membership' as const }
  }

  return { userId: user.id, orgId: membership.org_id, role: membership.role as OrgRole }
}

function str(formData: FormData, key: string): string | undefined {
  const val = formData.get(key)
  if (typeof val !== 'string' || val.trim() === '') return undefined
  return val.trim()
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createRecapAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string; shareToken?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageRecaps(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const eventId = str(formData, 'event_id')
    if (!eventId || !isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const partnerId = str(formData, 'partner_id')
    if (!partnerId || !isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    // Build default title from partner + event names
    let title = str(formData, 'title')
    if (!title) {
      const [event, partner] = await Promise.all([
        getEventById(eventId),
        getPartnerById(partnerId),
      ])
      const partnerName = partner?.name ?? 'Partner'
      const eventName = event?.name ?? 'Event'
      title = `${partnerName} — ${eventName} Recap`
    }

    const coverNote = str(formData, 'cover_note')

    const recap = await createRecap(auth.orgId, {
      event_id: eventId,
      partner_id: partnerId,
      title,
      cover_note: coverNote,
      generated_by: auth.userId,
    })

    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true, id: recap.id, shareToken: recap.share_token }
  } catch (err: unknown) {
    const e = err as Record<string, unknown>
    console.error('createRecapAction error:', {
      message: e?.message,
      code: e?.code,
      details: e?.details,
      hint: e?.hint,
    })
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create recap' }
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateRecapAction(
  recapId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(recapId)) return { ok: false, error: 'Invalid recap ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageRecaps(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const title = str(formData, 'title')
    if (!title) return { ok: false, error: 'Title is required' }

    const eventId = str(formData, 'event_id')
    const partnerId = str(formData, 'partner_id')
    const coverNote = formData.get('cover_note') as string | null

    await updateRecap(recapId, {
      title,
      cover_note: coverNote?.trim() || undefined,
    })

    if (eventId && partnerId) {
      revalidatePath(`/events/${eventId}/partners/${partnerId}`)
      revalidatePath(`/events/${eventId}/partners/${partnerId}/recap/${recapId}`)
    }

    return { ok: true }
  } catch (err) {
    console.error('updateRecapAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update recap' }
  }
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export async function publishRecapAction(
  recapId: string
): Promise<{ ok: boolean; error?: string; shareUrl?: string }> {
  try {
    if (!isUuid(recapId)) return { ok: false, error: 'Invalid recap ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageRecaps(auth.role)) {
      return { ok: false, error: 'You do not have permission to publish recaps' }
    }

    const recap = await publishRecap(recapId)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/recap/${recap.share_token}`

    // Notify org admins
    const admin = tryCreateAdminClient()
    if (admin) {
      notifyOrgAdmins(admin, auth.orgId, auth.userId, {
        type: 'recap_published',
        title: `Recap "${recap.title}" published`,
        link: shareUrl,
      }).catch(() => {}) // Non-critical
    }

    // Email the partner contact if they have an email on file
    if (recap.partner_id && recap.event_id) {
      const supabase = await createClient()
      Promise.all([
        getPartnerById(recap.partner_id),
        getEventById(recap.event_id),
        getOrganization(supabase, auth.orgId),
      ]).then(async ([partner, event, org]) => {
        if (partner?.contact_email) {
          await sendEmail({
            to: partner.contact_email,
            subject: recapSharedEmailSubject({ eventName: event?.name ?? 'your event', orgName: org?.name ?? 'your organization' }),
            html: recapSharedEmailHtml({
              partnerName: partner.contact_name || partner.name,
              eventName: event?.name ?? 'your event',
              orgName: org?.name ?? 'your organization',
              shareUrl,
            }),
          })
        }
      }).catch(() => {}) // Non-critical
    }

    return { ok: true, shareUrl }
  } catch (err) {
    console.error('publishRecapAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to publish recap' }
  }
}

// ---------------------------------------------------------------------------
// Unpublish
// ---------------------------------------------------------------------------

export async function unpublishRecapAction(
  recapId: string,
  eventId: string,
  partnerId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(recapId)) return { ok: false, error: 'Invalid recap ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageRecaps(auth.role)) {
      return { ok: false, error: 'You do not have permission to unpublish recaps' }
    }

    await updateRecap(recapId, { status: 'draft' })

    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/recap/${recapId}`)

    return { ok: true }
  } catch (err) {
    console.error('unpublishRecapAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to unpublish recap' }
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteRecapAction(
  recapId: string,
  eventId: string,
  partnerId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(recapId)) return { ok: false, error: 'Invalid recap ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    if (!canManageRecaps(auth.role)) {
      return { ok: false, error: 'You do not have permission to delete recaps' }
    }

    await deleteRecap(recapId)

    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)

    return { ok: true }
  } catch (err) {
    console.error('deleteRecapAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete recap' }
  }
}
