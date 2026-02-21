import { escape, ctaButton, emailLayout } from './layout'
import { relativeEventTime } from '@/lib/relative-time'

interface PartnerAlert {
  partnerName: string
  totalDeliverables: number
  unprovedItems: { title: string }[]
}

interface PostEventScanEmailProps {
  recipientName: string
  eventName: string
  eventDate: string
  partnerAlerts: PartnerAlert[]
  eventUrl: string
}

export function postEventScanEmailSubject({ eventName }: Pick<PostEventScanEmailProps, 'eventName'>): string {
  return `Proof needed: ${eventName} deliverables still unproved`
}

export function postEventScanEmailHtml({
  recipientName,
  eventName,
  eventDate,
  partnerAlerts,
  eventUrl,
}: PostEventScanEmailProps): string {
  const totalUnproved = partnerAlerts.reduce((sum, pa) => sum + pa.unprovedItems.length, 0)
  const relTime = relativeEventTime(eventDate)

  const partnerSections = partnerAlerts
    .map((pa) => {
      const missingList = pa.unprovedItems
        .slice(0, 6)
        .map(
          (item) =>
            `<li style="margin:0 0 2px;font-size:13px;color:#6b7280;line-height:1.5;">${escape(item.title)}</li>`
        )
        .join('')

      const moreCount = pa.unprovedItems.length - 6
      const moreText =
        moreCount > 0
          ? `<li style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">+${moreCount} more</li>`
          : ''

      return `<div style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;">
          ${escape(pa.partnerName)}
          <span style="font-weight:400;color:#dc2626;"> &mdash; ${pa.unprovedItems.length}/${pa.totalDeliverables} unproved</span>
        </p>
        <p style="margin:0 0 4px;font-size:12px;font-weight:500;color:#9ca3af;text-transform:uppercase;">Missing:</p>
        <ul style="margin:0;padding-left:20px;">${missingList}${moreText}</ul>
      </div>`
    })
    .join('')

  return emailLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
      Post-event proof check: ${escape(eventName)}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
      Hi ${escape(recipientName)},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      <strong>${escape(eventName)}</strong> (${escape(eventDate)}). ${relTime}.
      ${totalUnproved} deliverable${totalUnproved !== 1 ? 's are' : ' is'} still missing proof across ${partnerAlerts.length} partner${partnerAlerts.length !== 1 ? 's' : ''}:
    </p>
    <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      ${partnerSections}
    </div>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton('Upload Proof', eventUrl)}
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      Upload proof while it's still fresh — photos, screenshots, or links all work.
    </p>
  `)
}
