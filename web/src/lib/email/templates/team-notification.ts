import { escape, ctaButton, emailLayout } from './layout'

interface TeamNotificationEmailProps {
  userName: string
  subject: string
  body: string
  ctaUrl?: string
  ctaLabel?: string
}

export function teamNotificationEmailSubject({ subject }: Pick<TeamNotificationEmailProps, 'subject'>): string {
  return subject
}

export function teamNotificationEmailHtml({ userName, body, ctaUrl, ctaLabel }: TeamNotificationEmailProps): string {
  const ctaBlock = ctaUrl && ctaLabel
    ? `<div style="text-align:center;margin:0 0 24px;">${ctaButton(ctaLabel, ctaUrl)}</div>`
    : ''

  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Team update
    </h1>
    <p style="margin:0 0 8px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(userName)},
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
      ${escape(body)}
    </p>
    ${ctaBlock}
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      If you have questions about this change, contact your workspace administrator.
    </p>
  `)
}
