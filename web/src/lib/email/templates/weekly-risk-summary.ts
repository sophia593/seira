import { escape, ctaButton, emailLayout } from './layout'

interface EventRisk {
  eventName: string
  eventDate: string | null
  overdueCount: number
  needsProofCount: number
  upcomingDueCount: number
}

interface WeeklyRiskEmailProps {
  recipientName: string
  orgName: string
  events: EventRisk[]
  dashboardUrl: string
}

export function weeklyRiskEmailSubject({ orgName }: Pick<WeeklyRiskEmailProps, 'orgName'>): string {
  return `Weekly risk summary — ${orgName}`
}

export function weeklyRiskEmailHtml({ recipientName, orgName, events, dashboardUrl }: WeeklyRiskEmailProps): string {
  const totalOverdue = events.reduce((sum, e) => sum + e.overdueCount, 0)
  const totalNeedsProof = events.reduce((sum, e) => sum + e.needsProofCount, 0)
  const totalUpcomingDue = events.reduce((sum, e) => sum + e.upcomingDueCount, 0)

  const summaryItems: string[] = []
  if (totalOverdue > 0) summaryItems.push(`<strong style="color:#dc2626;">${totalOverdue} overdue</strong>`)
  if (totalNeedsProof > 0) summaryItems.push(`<strong style="color:#d97706;">${totalNeedsProof} missing proof</strong>`)
  if (totalUpcomingDue > 0) summaryItems.push(`<strong style="color:#2563eb;">${totalUpcomingDue} due this week</strong>`)

  const eventRows = events
    .filter((e) => e.overdueCount > 0 || e.needsProofCount > 0 || e.upcomingDueCount > 0)
    .map((e) => {
      const badges: string[] = []
      if (e.overdueCount > 0) badges.push(`<span style="display:inline-block;padding:2px 8px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:600;border-radius:4px;">${e.overdueCount} overdue</span>`)
      if (e.needsProofCount > 0) badges.push(`<span style="display:inline-block;padding:2px 8px;background:#fefce8;color:#d97706;font-size:11px;font-weight:600;border-radius:4px;">${e.needsProofCount} no proof</span>`)
      if (e.upcomingDueCount > 0) badges.push(`<span style="display:inline-block;padding:2px 8px;background:#eff6ff;color:#2563eb;font-size:11px;font-weight:600;border-radius:4px;">${e.upcomingDueCount} due soon</span>`)

      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">${escape(e.eventName)}</p>
            ${e.eventDate ? `<p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">${escape(e.eventDate)}</p>` : ''}
            <div style="display:flex;gap:6px;flex-wrap:wrap;">${badges.join(' ')}</div>
          </td>
        </tr>`
    })
    .join('')

  const noRisks = eventRows.length === 0

  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Weekly risk summary
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(recipientName)}, here's your Monday morning update for <strong>${escape(orgName)}</strong>.
    </p>
    ${noRisks ? `
      <div style="padding:20px;background-color:#f0fdf4;border-radius:8px;text-align:center;margin:0 0 24px;">
        <p style="margin:0;font-size:15px;color:#15803d;font-weight:500;">All clear — no at-risk deliverables this week.</p>
      </div>
    ` : `
      <div style="padding:12px 16px;background-color:#f9fafb;border-radius:8px;margin:0 0 16px;">
        <p style="margin:0;font-size:14px;color:#4b5563;">
          Across all events: ${summaryItems.join(' · ')}
        </p>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${eventRows}
      </table>
    `}
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('View Dashboard', dashboardUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      This summary is sent every Monday morning. Focus on overdue items first.
    </p>
  `)
}
