import { escape, ctaButton, emailLayout } from './layout'

export interface PartnerReminderItem {
  title: string
  category: string
  dueDate: string | null
  issue: 'overdue' | 'needs_proof'
}

interface PartnerReminderEmailProps {
  recipientName: string
  partnerName: string
  eventName: string
  items: PartnerReminderItem[]
  directUrl: string
  senderName: string
}

export function partnerReminderEmailSubject({ partnerName }: Pick<PartnerReminderEmailProps, 'partnerName'>): string {
  return `Action needed: ${partnerName} deliverables`
}

function issueBadge(issue: 'overdue' | 'needs_proof'): string {
  if (issue === 'overdue') {
    return '<span style="display:inline-block;padding:2px 8px;font-size:11px;font-weight:600;color:#dc2626;background-color:#fef2f2;border-radius:4px;">Overdue</span>'
  }
  return '<span style="display:inline-block;padding:2px 8px;font-size:11px;font-weight:600;color:#d97706;background-color:#fefce8;border-radius:4px;">Needs proof</span>'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function partnerReminderEmailHtml({
  recipientName,
  partnerName,
  eventName,
  items,
  directUrl,
  senderName,
}: PartnerReminderEmailProps): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;">${escape(item.title)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${escape(item.category)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${formatDate(item.dueDate)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${issueBadge(item.issue)}</td>
      </tr>`,
    )
    .join('')

  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Partner deliverables need attention
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(recipientName)},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      ${escape(senderName)} flagged ${items.length} deliverable${items.length !== 1 ? 's' : ''} for
      <strong>${escape(partnerName)}</strong> (${escape(eventName)}) that need attention:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;">
        <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Deliverable</th>
        <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Category</th>
        <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Due</th>
        <th style="padding:8px 12px;font-size:11px;font-weight:600;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Issue</th>
      </tr>
      ${rows}
    </table>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('View Partner', directUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      Resolve overdue items and upload proof to keep fulfillment on track.
    </p>
  `)
}
