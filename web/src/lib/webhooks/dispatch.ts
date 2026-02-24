import { createHmac, randomBytes } from 'crypto'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { formatSlackPayload } from '@/lib/webhooks/slack-blocks'
import type { WebhookEventType } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  data: Record<string, unknown>
}

interface DeliveryOptions {
  attemptNumber?: number
  originalDeliveryId?: string | null
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

function signPayload(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

export function generateSigningSecret(): string {
  return `whsec_${randomBytes(32).toString('hex')}`
}

// ---------------------------------------------------------------------------
// Slack detection
// ---------------------------------------------------------------------------

export function isSlackWebhookUrl(url: string): boolean {
  return url.startsWith('https://hooks.slack.com/')
}

// ---------------------------------------------------------------------------
// Deliver a single webhook
// ---------------------------------------------------------------------------

async function deliverWebhook(
  webhookId: string,
  orgId: string,
  url: string,
  signingSecret: string,
  payload: WebhookPayload,
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  options?: DeliveryOptions,
): Promise<void> {
  const attemptNumber = options?.attemptNumber ?? 1
  const originalDeliveryId = options?.originalDeliveryId ?? null

  let body: string
  let headers: Record<string, string>

  if (isSlackWebhookUrl(url)) {
    // Slack: send Block Kit payload, no HMAC (auth embedded in URL token)
    body = JSON.stringify(formatSlackPayload(payload))
    headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Seira-Webhooks/1.0',
    }
  } else {
    body = JSON.stringify(payload)
    const signature = signPayload(body, signingSecret)
    headers = {
      'Content-Type': 'application/json',
      'X-Seira-Signature': signature,
      'X-Seira-Event': payload.event,
      'X-Seira-Timestamp': payload.timestamp,
      'User-Agent': 'Seira-Webhooks/1.0',
    }
  }

  const startTime = Date.now()

  let statusCode: number | null = null
  let responseBody: string | null = null
  let error: string | null = null
  let success = false

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    statusCode = response.status
    success = response.status >= 200 && response.status < 300

    try {
      const text = await response.text()
      responseBody = text.slice(0, 1000)
    } catch {
      // Response body read failure is non-critical
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown delivery error'
  }

  const durationMs = Date.now() - startTime

  // Determine if retries should stop
  const is4xx = statusCode !== null && statusCode >= 400 && statusCode < 500
  const retriesExhausted = !success && (attemptNumber >= 5 || is4xx)

  // Log delivery attempt
  try {
    await admin.from('webhook_delivery_log').insert({
      webhook_id: webhookId,
      org_id: orgId,
      event_type: payload.event,
      payload: payload as unknown as Record<string, unknown>,
      status_code: statusCode,
      response_body: responseBody,
      error,
      duration_ms: durationMs,
      success,
      attempt_number: attemptNumber,
      original_delivery_id: originalDeliveryId,
      retries_exhausted: retriesExhausted,
    })
  } catch (logErr) {
    console.error('[Webhook] Failed to log delivery:', logErr)
  }

  // Update last_triggered_at
  try {
    await admin.from('webhooks').update({ last_triggered_at: new Date().toISOString() }).eq('id', webhookId)
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Retry a failed delivery (called from cron)
// ---------------------------------------------------------------------------

export async function retryDelivery(
  admin: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  failedLog: {
    id: string
    webhook_id: string
    org_id: string
    event_type: WebhookEventType
    payload: Record<string, unknown>
    attempt_number: number
    original_delivery_id: string | null
  },
): Promise<void> {
  // Fetch the webhook — bail if deleted or inactive
  const { data: webhook } = await admin
    .from('webhooks')
    .select('url, signing_secret, active')
    .eq('id', failedLog.webhook_id)
    .single()

  if (!webhook || !webhook.active) return

  // Reconstruct the payload from stored JSONB
  const storedPayload = failedLog.payload as unknown as WebhookPayload
  const payload: WebhookPayload = {
    event: storedPayload.event ?? failedLog.event_type,
    timestamp: storedPayload.timestamp ?? new Date().toISOString(),
    data: storedPayload.data ?? {},
  }

  // The original_delivery_id is the first attempt's ID
  const originalId = failedLog.original_delivery_id ?? failedLog.id

  await deliverWebhook(
    failedLog.webhook_id,
    failedLog.org_id,
    webhook.url,
    webhook.signing_secret,
    payload,
    admin,
    {
      attemptNumber: failedLog.attempt_number + 1,
      originalDeliveryId: originalId,
    },
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fire webhooks for a given event type and org.
 * Fire-and-forget — never throws or blocks the caller.
 */
export function fireWebhook(
  eventType: WebhookEventType,
  orgId: string,
  data: Record<string, unknown>,
): void {
  void (async () => {
    try {
      const admin = tryCreateAdminClient()
      if (!admin) return

      const { data: webhooks, error } = await admin
        .from('webhooks')
        .select('id, url, signing_secret')
        .eq('org_id', orgId)
        .eq('active', true)
        .contains('events', [eventType])

      if (error || !webhooks || webhooks.length === 0) return

      const payload: WebhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data,
      }

      await Promise.allSettled(
        webhooks.map((wh) =>
          deliverWebhook(wh.id, orgId, wh.url, wh.signing_secret, payload, admin),
        ),
      )
    } catch (err) {
      console.error('[Webhook] fireWebhook failed:', err)
    }
  })()
}
