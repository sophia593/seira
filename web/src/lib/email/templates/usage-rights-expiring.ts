import { escape, ctaButton, emailLayout } from './layout'

interface UsageRightsExpiringEmailProps {
  recipientName: string
  deliverableTitle: string
  talentName: string | null
  partnerName: string
  eventName: string
  expirationDate: string
  daysRemaining: number
  directUrl: string
}

export function usageRightsExpiringEmailSubject({
  deliverableTitle,
}: Pick<UsageRightsExpiringEmailProps, 'deliverableTitle'>): string {
  return `Usage rights expiring: ${deliverableTitle}`
}

export function usageRightsExpiringEmailHtml({
  recipientName,
  deliverableTitle,
  talentName,
  partnerName,
  eventName,
  expirationDate,
  daysRemaining,
  directUrl,
}: UsageRightsExpiringEmailProps): string {
  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Usage Rights Expiring Soon
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(recipientName)},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      Usage rights for a talent deliverable will expire in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:16px;background-color:#fef3c7;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#111827;">${escape(deliverableTitle)}</p>
          ${talentName ? `<p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Talent: <strong>${escape(talentName)}</strong></p>` : ''}
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Partner: <strong>${escape(partnerName)}</strong></p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Event: <strong>${escape(eventName)}</strong></p>
          <p style="margin:0;font-size:13px;color:#d97706;font-weight:500;">Expires: ${escape(expirationDate)}</p>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('View Deliverable', directUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      To extend or renew usage rights, visit the deliverable detail page and use the Extend option.
    </p>
  `)
}
