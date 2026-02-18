import { escape, ctaButton, emailLayout } from './layout'

interface RecapSharedEmailProps {
  partnerName: string
  eventName: string
  orgName: string
  shareUrl: string
}

export function recapSharedEmailSubject({ eventName, orgName }: Pick<RecapSharedEmailProps, 'eventName' | 'orgName'>): string {
  return `${eventName} — Sponsorship Recap from ${orgName}`
}

export function recapSharedEmailHtml({ partnerName, eventName, orgName, shareUrl }: RecapSharedEmailProps): string {
  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Your sponsorship recap is ready
    </h1>
    <p style="margin:0 0 8px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(partnerName)},
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
      ${escape(orgName)} has published a sponsorship fulfillment recap for
      <strong>${escape(eventName)}</strong>. This report includes proof of
      delivery for all contracted deliverables.
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('View Recap Report', shareUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      This link is shareable — feel free to forward it to your team. No login required.
    </p>
  `)
}
