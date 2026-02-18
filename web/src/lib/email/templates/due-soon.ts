import { escape, ctaButton, emailLayout } from './layout'

interface DueSoonEmailProps {
  recipientName: string
  deliverableTitle: string
  partnerName: string
  eventName: string
  dueDate: string
  directUrl: string
}

export function dueSoonEmailSubject({ deliverableTitle, dueDate }: Pick<DueSoonEmailProps, 'deliverableTitle' | 'dueDate'>): string {
  return `Reminder: ${deliverableTitle} due ${dueDate}`
}

export function dueSoonEmailHtml({ recipientName, deliverableTitle, partnerName, eventName, dueDate, directUrl }: DueSoonEmailProps): string {
  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Deliverable due soon
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(recipientName)},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      A deliverable is due within the next 48 hours:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:16px;background-color:#f9fafb;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#111827;">${escape(deliverableTitle)}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Partner: <strong>${escape(partnerName)}</strong></p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Event: <strong>${escape(eventName)}</strong></p>
          <p style="margin:0;font-size:13px;color:#dc2626;font-weight:500;">Due: ${escape(dueDate)}</p>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('View Deliverable', directUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      Make sure proof is uploaded before the deadline to keep your fulfillment on track.
    </p>
  `)
}
