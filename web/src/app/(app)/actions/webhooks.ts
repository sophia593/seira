'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import {
  createWebhook,
  updateWebhook,
  deleteWebhook,
  listWebhooksByOrg,
} from '@/lib/db/webhooks'
import { generateSigningSecret, isSlackWebhookUrl } from '@/lib/webhooks/dispatch'
import { isUuid } from '@/lib/validation'
import { canManageContent } from '@/lib/permissions'
import type { OrgRole, WebhookEventType, Webhook } from '@/lib/types/database'

const VALID_EVENTS: WebhookEventType[] = [
  'recap_published',
  'deliverable_proved',
  'event_completed',
  'partner_added',
]

const MAX_WEBHOOKS_PER_ORG = 10

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

  return { supabase, orgId: membership.org_id, role: membership.role as OrgRole, userId: user.id }
}

function validateUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'URL is required' }
  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, error: 'URL must use HTTP or HTTPS' }
    }
    return { ok: true, url: trimmed }
  } catch {
    return { ok: false, error: 'Invalid URL format' }
  }
}

function validateEvents(events: WebhookEventType[]): string | null {
  if (!events.length) return 'Select at least one event'
  for (const evt of events) {
    if (!VALID_EVENTS.includes(evt)) return `Invalid event type: ${evt}`
  }
  return null
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createWebhookAction(
  url: string,
  events: WebhookEventType[],
  description?: string,
): Promise<{ ok: boolean; error?: string; webhook?: Webhook }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can manage webhooks' }

    const urlResult = validateUrl(url)
    if (!urlResult.ok) return { ok: false, error: urlResult.error }

    const eventsError = validateEvents(events)
    if (eventsError) return { ok: false, error: eventsError }

    const existing = await listWebhooksByOrg(auth.orgId)
    if (existing.length >= MAX_WEBHOOKS_PER_ORG) {
      return { ok: false, error: `Maximum of ${MAX_WEBHOOKS_PER_ORG} webhooks per workspace` }
    }

    const webhook = await createWebhook(
      auth.orgId,
      { url: urlResult.url, events, description: description?.trim() || undefined },
      generateSigningSecret(),
    )

    revalidatePath('/settings')
    return { ok: true, webhook }
  } catch (err) {
    console.error('createWebhookAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create webhook' }
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateWebhookAction(
  webhookId: string,
  updates: {
    url?: string
    events?: WebhookEventType[]
    active?: boolean
    description?: string
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(webhookId)) return { ok: false, error: 'Invalid webhook ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can manage webhooks' }

    if (updates.url !== undefined) {
      const urlResult = validateUrl(updates.url)
      if (!urlResult.ok) return { ok: false, error: urlResult.error }
      updates.url = urlResult.url
    }

    if (updates.events !== undefined) {
      const eventsError = validateEvents(updates.events)
      if (eventsError) return { ok: false, error: eventsError }
    }

    await updateWebhook(webhookId, updates)
    revalidatePath('/settings')
    return { ok: true }
  } catch (err) {
    console.error('updateWebhookAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update webhook' }
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteWebhookAction(
  webhookId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(webhookId)) return { ok: false, error: 'Invalid webhook ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can manage webhooks' }

    await deleteWebhook(webhookId)
    revalidatePath('/settings')
    return { ok: true }
  } catch (err) {
    console.error('deleteWebhookAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete webhook' }
  }
}

// ---------------------------------------------------------------------------
// Slack webhook
// ---------------------------------------------------------------------------

export async function saveSlackWebhookAction(
  url: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can manage webhooks' }

    const existing = await listWebhooksByOrg(auth.orgId)
    const slackWebhook = existing.find((wh) => isSlackWebhookUrl(wh.url))

    const trimmedUrl = url.trim()

    // If empty URL — remove existing Slack webhook
    if (!trimmedUrl) {
      if (slackWebhook) {
        await deleteWebhook(slackWebhook.id)
      }
      revalidatePath('/settings')
      return { ok: true }
    }

    // Validate URL is a Slack webhook
    if (!isSlackWebhookUrl(trimmedUrl)) {
      return { ok: false, error: 'URL must start with https://hooks.slack.com/' }
    }

    // Validate it's a proper URL
    try {
      new URL(trimmedUrl)
    } catch {
      return { ok: false, error: 'Invalid URL format' }
    }

    const allEvents: WebhookEventType[] = ['recap_published', 'deliverable_proved', 'event_completed', 'partner_added']

    if (slackWebhook) {
      // Update existing
      await updateWebhook(slackWebhook.id, { url: trimmedUrl, events: allEvents })
    } else {
      // Check max limit
      if (existing.length >= MAX_WEBHOOKS_PER_ORG) {
        return { ok: false, error: `Maximum of ${MAX_WEBHOOKS_PER_ORG} webhooks per workspace` }
      }
      // Create new
      await createWebhook(
        auth.orgId,
        { url: trimmedUrl, events: allEvents, description: 'Slack' },
        generateSigningSecret(),
      )
    }

    revalidatePath('/settings')
    return { ok: true }
  } catch (err) {
    console.error('saveSlackWebhookAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to save Slack webhook' }
  }
}
