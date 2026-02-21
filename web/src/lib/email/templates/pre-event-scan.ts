import { escape, ctaButton, emailLayout } from './layout'

interface DeliverableFlag {
  title: string
  partnerName: string
  reason: 'no_owner' | 'not_started'
}

interface PreEventScanEmailProps {
  recipientName: string
  eventName: string
  eventDate: string
  hoursUntil: number
  flaggedItems: DeliverableFlag[]
  eventUrl: string
}

export function preEventScanEmailSubject({ eventName }: Pick<PreEventScanEmailProps, 'eventName'>): string {
  return `Action needed: ${eventName} is in 72 hours`
}

export function preEventScanEmailHtml({
  recipientName,
  eventName,
  eventDate,
  flaggedItems,
  eventUrl,
}: PreEventScanEmailProps): string {
  const rows = flaggedItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;">${escape(item.title)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">${escape(item.partnerName)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#dc2626;font-weight:500;">${item.reason === 'no_owner' ? 'No owner' : 'Not started'}</td>
        </tr>`
    )
    .join('')

  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Pre-event check: ${escape(eventName)}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(recipientName)},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      <strong>${escape(eventName)}</strong> (${escape(eventDate)}) is less than 72 hours away.
      ${flaggedItems.length} deliverable${flaggedItems.length !== 1 ? 's' : ''} still need${flaggedItems.length === 1 ? 's' : ''} attention:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;">
        <th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Deliverable</th>
        <th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Partner</th>
        <th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Issue</th>
      </tr>
      ${rows}
    </table>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('View Event', eventUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      Assign owners and get these started before the event.
    </p>
  `)
}
