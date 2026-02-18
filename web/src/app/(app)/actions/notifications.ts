'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { markAsRead, markAllAsRead } from '@/lib/db/notifications'
import { isUuid } from '@/lib/validation'

// ---------------------------------------------------------------------------
// Mark single notification as read
// ---------------------------------------------------------------------------

export async function markNotificationReadAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Not authenticated' }
    }

    const notificationId = formData.get('notification_id') as string | null
    if (!notificationId || !isUuid(notificationId)) {
      return { ok: false, error: 'Invalid notification ID' }
    }

    await markAsRead(supabase, notificationId, user.id)
    return { ok: true }
  } catch (err) {
    console.error('markNotificationReadAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to mark as read' }
  }
}

// ---------------------------------------------------------------------------
// Mark all notifications as read
// ---------------------------------------------------------------------------

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Not authenticated' }
    }

    const membership = await getUserMembership(supabase, user.id)
    if (!membership) {
      return { ok: false, error: 'No organization membership' }
    }

    await markAllAsRead(supabase, user.id, membership.org_id)
    return { ok: true }
  } catch (err) {
    console.error('markAllNotificationsReadAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to mark all as read' }
  }
}
