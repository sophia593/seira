// lib/db/notifications.ts
// Notification CRUD operations

import { handleDbError, type SupabaseClient } from './client'
import type { AppNotification, NotificationType } from '@/lib/types/database'

// =============================================================================
// Read Operations
// =============================================================================

/**
 * List notifications for a user in an organization.
 */
export async function listNotifications(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  options?: { limit?: number; offset?: number }
): Promise<AppNotification[]> {
  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    handleDbError(error, 'Failed to list notifications')
  }

  return (data ?? []) as AppNotification[]
}

/**
 * Get unread notification count for a user in an organization.
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .is('read_at', null)

  if (error) {
    // Non-critical — return 0
    return 0
  }

  return count ?? 0
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) {
    handleDbError(error, 'Failed to mark notification as read')
  }
}

/**
 * Mark all notifications as read for a user in an organization.
 */
export async function markAllAsRead(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .is('read_at', null)

  if (error) {
    handleDbError(error, 'Failed to mark all notifications as read')
  }
}

// =============================================================================
// Write Operations (admin client — bypasses RLS)
// =============================================================================

export interface CreateNotificationInput {
  userId: string
  orgId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
  metadata?: Record<string, unknown>
}

/**
 * Create a notification for a user. Uses admin client (service_role)
 * since authenticated users don't have INSERT on notifications.
 */
export async function createNotification(
  adminClient: SupabaseClient,
  input: CreateNotificationInput
): Promise<void> {
  const { error } = await adminClient
    .from('notifications')
    .insert({
      user_id: input.userId,
      org_id: input.orgId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      metadata: input.metadata ?? {},
    })

  if (error) {
    // Non-critical — log but don't throw
    console.error('[Notifications] Failed to create notification:', error)
  }
}

/**
 * Create notifications for all org members (except excludeUserId).
 * Useful for broadcasting events like "proof uploaded" to admins.
 */
export async function notifyOrgAdmins(
  adminClient: SupabaseClient,
  orgId: string,
  excludeUserId: string,
  notification: Omit<CreateNotificationInput, 'userId' | 'orgId'>
): Promise<void> {
  // Get org admins/owners
  const { data: members } = await adminClient
    .from('organization_members')
    .select('user_id, role')
    .eq('org_id', orgId)
    .in('role', ['owner', 'admin'])

  if (!members || members.length === 0) return

  const rows = members
    .filter((m) => m.user_id !== excludeUserId)
    .map((m) => ({
      user_id: m.user_id,
      org_id: orgId,
      type: notification.type,
      title: notification.title,
      body: notification.body ?? null,
      link: notification.link ?? null,
      metadata: notification.metadata ?? {},
    }))

  if (rows.length === 0) return

  const { error } = await adminClient.from('notifications').insert(rows)

  if (error) {
    console.error('[Notifications] Failed to notify org admins:', error)
  }
}
