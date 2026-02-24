import { createClient } from '@/lib/supabase/server'
import { handleDbError } from './client'
import type { Webhook, WebhookDeliveryLog } from '@/lib/types/database'

// =============================================================================
// Read
// =============================================================================

export async function listWebhooksByOrg(orgId: string): Promise<Webhook[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) handleDbError(error, 'Failed to list webhooks')
  return (data ?? []) as Webhook[]
}

export async function getWebhookById(webhookId: string): Promise<Webhook | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    handleDbError(error, 'Failed to get webhook')
  }
  return data as Webhook
}

export async function getRecentDeliveryLogs(
  webhookId: string,
  limit = 10,
): Promise<WebhookDeliveryLog[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('webhook_delivery_log')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) handleDbError(error, 'Failed to get delivery logs')
  return (data ?? []) as WebhookDeliveryLog[]
}

// =============================================================================
// Write
// =============================================================================

export async function createWebhook(
  orgId: string,
  input: { url: string; events: string[]; description?: string },
  signingSecret: string,
): Promise<Webhook> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      org_id: orgId,
      url: input.url,
      events: input.events,
      active: true,
      signing_secret: signingSecret,
      description: input.description ?? null,
    })
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to create webhook')
  return data as Webhook
}

export async function updateWebhook(
  webhookId: string,
  updates: Partial<Pick<Webhook, 'url' | 'events' | 'active' | 'description'>>,
): Promise<Webhook> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('webhooks')
    .update(updates)
    .eq('id', webhookId)
    .select()
    .single()

  if (error) handleDbError(error, 'Failed to update webhook')
  return data as Webhook
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', webhookId)

  if (error) handleDbError(error, 'Failed to delete webhook')
}
