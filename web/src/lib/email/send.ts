import { getResend, EMAIL_FROM } from './client'

interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

/**
 * Send a transactional email via Resend.
 * Non-throwing — returns true on success, false on failure or if Resend is not configured.
 * Email is always non-critical and should never block the primary action.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    })

    if (error) {
      console.error('[Email] Failed to send:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[Email] Send error:', err)
    return false
  }
}
