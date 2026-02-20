import { escape, ctaButton, emailLayout } from './layout'

interface ProofReminderEmailProps {
  recipientName: string
  deliverableTitle: string
  partnerName: string
  eventName: string
  directUrl: string
  senderName: string
}

export function proofReminderEmailSubject({ deliverableTitle }: Pick<ProofReminderEmailProps, 'deliverableTitle'>): string {
  return `Proof reminder: ${deliverableTitle}`
}

export function proofReminderEmailHtml({
  recipientName,
  deliverableTitle,
  partnerName,
  eventName,
  directUrl,
  senderName,
}: ProofReminderEmailProps): string {
  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Proof reminder
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(recipientName)},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      ${escape(senderName)} requested a reminder to upload proof for the following deliverable:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:16px;background-color:#fefce8;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#111827;">${escape(deliverableTitle)}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Partner: <strong>${escape(partnerName)}</strong></p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Event: <strong>${escape(eventName)}</strong></p>
          <p style="margin:0;font-size:13px;color:#d97706;font-weight:500;">Status: Done &mdash; proof missing</p>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('Upload Proof', directUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      Upload proof of delivery so this deliverable can be included in the partner recap report.
    </p>
  `)
}
