'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { createEvent, updateEvent, deleteEvent } from '@/lib/db/events'
import type { EventStatus } from '@/lib/types/database'

const VALID_STATUSES: EventStatus[] = ['upcoming', 'active', 'completed', 'archived']

async function getAuthenticatedOrg() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const membership = await getUserMembership(
    supabase as Parameters<typeof getUserMembership>[0],
    user.id
  )
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

export async function createEventAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Event name is required' }

    const event = await createEvent(auth.orgId, {
      name,
      date: str(formData, 'date'),
      venue: str(formData, 'venue'),
      notes: str(formData, 'notes'),
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${event.id}`)

    return { ok: true, id: event.id }
  } catch (err) {
    console.error('createEventAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create event' }
  }
}

export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    const name = str(formData, 'name')
    if (!name) return { ok: false, error: 'Event name is required' }

    const statusRaw = str(formData, 'status')
    const status = statusRaw && VALID_STATUSES.includes(statusRaw as EventStatus)
      ? (statusRaw as EventStatus)
      : undefined

    await updateEvent(eventId, {
      name,
      date: str(formData, 'date'),
      venue: str(formData, 'venue'),
      status,
      notes: str(formData, 'notes'),
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)

    return { ok: true }
  } catch (err) {
    console.error('updateEventAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update event' }
  }
}

export async function deleteEventAction(
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }

    await deleteEvent(eventId)

    revalidatePath('/events')
    revalidatePath('/dashboard')

    return { ok: true }
  } catch (err) {
    console.error('deleteEventAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete event' }
  }
}
