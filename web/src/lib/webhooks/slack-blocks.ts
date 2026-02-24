/**
 * Slack Block Kit formatters for webhook payloads.
 *
 * Each event type gets a rich Block Kit message with header, content, and CTA button.
 * See: https://api.slack.com/block-kit
 */

import type { WebhookEventType } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlackTextObject {
  type: 'plain_text' | 'mrkdwn'
  text: string
  emoji?: boolean
}

interface SlackHeaderBlock {
  type: 'header'
  text: SlackTextObject
}

interface SlackSectionBlock {
  type: 'section'
  text: SlackTextObject
  accessory?: {
    type: 'button'
    text: SlackTextObject
    url: string
    action_id: string
  }
}

interface SlackDividerBlock {
  type: 'divider'
}

interface SlackContextBlock {
  type: 'context'
  elements: SlackTextObject[]
}

type SlackBlock = SlackHeaderBlock | SlackSectionBlock | SlackDividerBlock | SlackContextBlock

interface SlackMessage {
  text: string
  blocks: SlackBlock[]
}

interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Block helpers
// ---------------------------------------------------------------------------

function header(text: string): SlackHeaderBlock {
  return { type: 'header', text: { type: 'plain_text', text, emoji: true } }
}

function section(mrkdwn: string): SlackSectionBlock {
  return { type: 'section', text: { type: 'mrkdwn', text: mrkdwn } }
}

function sectionWithButton(
  mrkdwn: string,
  buttonText: string,
  url: string,
): SlackSectionBlock {
  return {
    type: 'section',
    text: { type: 'mrkdwn', text: mrkdwn },
    accessory: {
      type: 'button',
      text: { type: 'plain_text', text: buttonText, emoji: true },
      url,
      action_id: 'open_link',
    },
  }
}

function divider(): SlackDividerBlock {
  return { type: 'divider' }
}

function contextFooter(timestamp: string): SlackContextBlock {
  const date = new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return {
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `Seira | ${date}` }],
  }
}

// ---------------------------------------------------------------------------
// Event-specific formatters
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function formatRecapPublished(data: Record<string, unknown>, ts: string): SlackMessage {
  const title = (data.recap_title as string) || 'Untitled recap'
  const partnerName = (data.partner_name as string) || ''
  const eventName = (data.event_name as string) || ''
  const shareUrl = data.share_url as string | undefined

  const body = [
    `*${title}*`,
    partnerName && `Partner: ${partnerName}`,
    eventName && `Event: ${eventName}`,
  ].filter(Boolean).join('\n')

  const blocks: SlackBlock[] = [
    header('Recap Published'),
    divider(),
    shareUrl ? sectionWithButton(body, 'Open Recap', shareUrl) : section(body),
    contextFooter(ts),
  ]

  return { text: `Recap published: ${title}`, blocks }
}

function formatDeliverableProved(data: Record<string, unknown>, ts: string): SlackMessage {
  const title = (data.deliverable_title as string) || 'Untitled'
  const category = (data.category as string) || ''
  const partnerName = (data.partner_name as string) || ''
  const eventId = data.event_id as string | undefined
  const partnerId = data.partner_id as string | undefined

  const body = [
    `*${title}*`,
    category && `Category: ${category}`,
    partnerName && `Partner: ${partnerName}`,
  ].filter(Boolean).join('\n')

  const url = eventId && partnerId ? `${BASE_URL}/events/${eventId}/partners/${partnerId}` : undefined

  const blocks: SlackBlock[] = [
    header('Deliverable Proved'),
    divider(),
    url ? sectionWithButton(body, 'View', url) : section(body),
    contextFooter(ts),
  ]

  return { text: `Deliverable proved: ${title}`, blocks }
}

function formatEventCompleted(data: Record<string, unknown>, ts: string): SlackMessage {
  const name = (data.event_name as string) || 'Untitled event'
  const date = data.event_date as string | undefined
  const venue = data.venue as string | undefined
  const eventId = data.event_id as string | undefined

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const body = [
    `*${name}*`,
    formattedDate && `Date: ${formattedDate}`,
    venue && `Venue: ${venue}`,
  ].filter(Boolean).join('\n')

  const url = eventId ? `${BASE_URL}/events/${eventId}` : undefined

  const blocks: SlackBlock[] = [
    header('Event Completed'),
    divider(),
    url ? sectionWithButton(body, 'View Event', url) : section(body),
    contextFooter(ts),
  ]

  return { text: `Event completed: ${name}`, blocks }
}

function formatPartnerAdded(data: Record<string, unknown>, ts: string): SlackMessage {
  const name = (data.partner_name as string) || 'Unnamed partner'
  const contactName = data.contact_name as string | undefined
  const contactEmail = data.contact_email as string | undefined
  const dealValue = data.deal_value as number | undefined
  const eventId = data.event_id as string | undefined
  const partnerId = data.partner_id as string | undefined

  const body = [
    `*${name}*`,
    contactName && `Contact: ${contactName}`,
    contactEmail && `Email: ${contactEmail}`,
    dealValue && `Deal value: $${dealValue.toLocaleString()}`,
  ].filter(Boolean).join('\n')

  const url = eventId && partnerId ? `${BASE_URL}/events/${eventId}/partners/${partnerId}` : undefined

  const blocks: SlackBlock[] = [
    header('Partner Added'),
    divider(),
    url ? sectionWithButton(body, 'View Partner', url) : section(body),
    contextFooter(ts),
  ]

  return { text: `Partner added: ${name}`, blocks }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function formatSlackPayload(payload: WebhookPayload): SlackMessage {
  switch (payload.event) {
    case 'recap_published':
      return formatRecapPublished(payload.data, payload.timestamp)
    case 'deliverable_proved':
      return formatDeliverableProved(payload.data, payload.timestamp)
    case 'event_completed':
      return formatEventCompleted(payload.data, payload.timestamp)
    case 'partner_added':
      return formatPartnerAdded(payload.data, payload.timestamp)
    default: {
      // Fallback: generic message
      return {
        text: `Seira webhook: ${payload.event}`,
        blocks: [
          header('Seira Notification'),
          divider(),
          section(`Event: \`${payload.event}\`\n\`\`\`${JSON.stringify(payload.data, null, 2).slice(0, 500)}\`\`\``),
          contextFooter(payload.timestamp),
        ],
      }
    }
  }
}
