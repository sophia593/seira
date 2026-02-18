import { escape, ctaButton, emailLayout } from './layout'

interface InviteEmailProps {
  inviterName: string
  orgName: string
  role: string
  inviteUrl: string
}

export function inviteEmailSubject({ orgName }: Pick<InviteEmailProps, 'orgName'>): string {
  return `You've been invited to join ${orgName} on Seira`
}

export function inviteEmailHtml({ inviterName, orgName, role, inviteUrl }: InviteEmailProps): string {
  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      You're invited to ${escape(orgName)}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
      ${escape(inviterName)} invited you to join <strong>${escape(orgName)}</strong> as a
      <strong style="text-transform:capitalize;">${escape(role)}</strong> on Seira.
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('Accept Invitation', inviteUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      This invitation link will expire in 7 days. If you weren't expecting this, you can safely ignore this email.
    </p>
  `)
}
