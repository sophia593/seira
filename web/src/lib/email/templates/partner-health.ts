import { escape, ctaButton, emailLayout } from './layout'

interface UnhealthyPartner {
  name: string
  completionPct: number
  overdueCount: number
  totalDeliverables: number
  completedDeliverables: number
  dealValue: number
  missingTitles: string[]
}

interface PartnerHealthEmailProps {
  recipientName: string
  orgName: string
  partners: UnhealthyPartner[]
  dashboardUrl: string
}

export function partnerHealthEmailSubject({ count }: { count: number }): string {
  return `${count} partner${count !== 1 ? 's' : ''} below 70% fulfillment`
}

export function partnerHealthEmailHtml({
  recipientName,
  orgName,
  partners,
  dashboardUrl,
}: PartnerHealthEmailProps): string {
  const rows = partners
    .map((p) => {
      const shown = p.missingTitles.slice(0, 4).map(escape).join(', ')
      const moreCount = p.missingTitles.length - 4
      const missingLine =
        p.missingTitles.length > 0
          ? `<tr><td colspan="4" style="padding:2px 12px 8px;font-size:12px;color:#9ca3af;border-bottom:1px solid #f3f4f6;">Missing: ${shown}${moreCount > 0 ? ` +${moreCount} more` : ''}</td></tr>`
          : ''

      return `<tr>
          <td style="padding:8px 12px;${p.missingTitles.length > 0 ? '' : 'border-bottom:1px solid #f3f4f6;'}font-size:14px;color:#111827;font-weight:500;">${escape(p.name)}</td>
          <td style="padding:8px 12px;${p.missingTitles.length > 0 ? '' : 'border-bottom:1px solid #f3f4f6;'}font-size:13px;color:${p.completionPct < 40 ? '#dc2626' : '#d97706'};font-weight:600;text-align:right;">${p.completionPct}%</td>
          <td style="padding:8px 12px;${p.missingTitles.length > 0 ? '' : 'border-bottom:1px solid #f3f4f6;'}font-size:13px;color:#6b7280;text-align:right;">${p.overdueCount > 0 ? `${p.overdueCount} overdue` : '—'}</td>
          <td style="padding:8px 12px;${p.missingTitles.length > 0 ? '' : 'border-bottom:1px solid #f3f4f6;'}font-size:13px;color:#6b7280;text-align:right;">${p.dealValue > 0 ? `$${p.dealValue.toLocaleString()}` : '—'}</td>
        </tr>${missingLine}`
    })
    .join('')

  const totalAtRisk = partners.reduce((sum, p) => sum + p.dealValue, 0)

  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Partner health alert
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(recipientName)},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      ${partners.length} partner${partners.length !== 1 ? 's' : ''} in <strong>${escape(orgName)}</strong> ${partners.length !== 1 ? 'are' : 'is'} below 70% deliverable completion${totalAtRisk > 0 ? ` — <strong>$${totalAtRisk.toLocaleString()}</strong> in deal value at risk` : ''}.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;">
        <th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Partner</th>
        <th style="padding:8px 12px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Completion</th>
        <th style="padding:8px 12px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Overdue</th>
        <th style="padding:8px 12px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Deal Value</th>
      </tr>
      ${rows}
    </table>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('View Partners', dashboardUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      This alert is sent weekly for partners with active deliverables below 70% completion.
    </p>
  `)
}
