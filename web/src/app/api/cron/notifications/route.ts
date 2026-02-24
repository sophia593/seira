/**
 * Cron notification handler — runs hourly via Railway.
 *
 * Railway cron setup:
 *   Schedule: 0 * * * * (hourly)
 *   Command:  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/notifications
 *
 * Triggers:
 *   1. "Due in 48h" → email org owner
 *   2. "Done but no proof (24h+)" → email owner + admins
 *   3. "Weekly risk summary" → admins on Monday mornings
 *   4. "Pre-event scan (72h)" → flag no-owner or not-started deliverables
 *   5. "Post-event scan (24h)" → flag done-but-unproved deliverables
 *   6. "Partner health (weekly)" → flag partners below 70% completion
 *
 * All emails are logged to `email_notification_log` for deduplication.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/send'
import { dueSoonEmailSubject, dueSoonEmailHtml } from '@/lib/email/templates/due-soon'
import { needsProofEmailSubject, needsProofEmailHtml } from '@/lib/email/templates/needs-proof'
import { weeklyRiskEmailSubject, weeklyRiskEmailHtml } from '@/lib/email/templates/weekly-risk-summary'
import { preEventScanEmailSubject, preEventScanEmailHtml } from '@/lib/email/templates/pre-event-scan'
import { postEventScanEmailSubject, postEventScanEmailHtml } from '@/lib/email/templates/post-event-scan'
import { partnerHealthEmailSubject, partnerHealthEmailHtml } from '@/lib/email/templates/partner-health'
import { usageRightsExpiringEmailSubject, usageRightsExpiringEmailHtml } from '@/lib/email/templates/usage-rights-expiring'
import { relativeEventTime } from '@/lib/relative-time'
import { retryDelivery } from '@/lib/webhooks/dispatch'

// ---------------------------------------------------------------------------
// Admin client (inline — can't use cookie-based createClient from server.ts)
// ---------------------------------------------------------------------------

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrgMemberWithEmail {
  user_id: string
  role: string
  email: string
  name: string | null
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function deliverableUrl(eventId: string, partnerId: string): string {
  return `${BASE_URL}/events/${eventId}/partners/${partnerId}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No date'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function getOrgMembersWithEmails(
  admin: ReturnType<typeof getAdminClient>,
  orgId: string,
  roles?: string[]
): Promise<OrgMemberWithEmail[]> {
  let query = admin
    .from('organization_members')
    .select('user_id, role, users(email, name)')
    .eq('org_id', orgId)

  if (roles) {
    query = query.in('role', roles)
  }

  const { data } = await query

  return (data ?? []).map((row: Record<string, unknown>) => {
    const user = (Array.isArray(row.users) ? row.users[0] : row.users) as { email: string; name: string | null } | null
    return {
      user_id: row.user_id as string,
      role: row.role as string,
      email: user?.email ?? '',
      name: user?.name ?? null,
    }
  }).filter((m: OrgMemberWithEmail) => m.email)
}

async function isAlreadySent(
  admin: ReturnType<typeof getAdminClient>,
  triggerType: string,
  deliverableId: string,
  recipientEmail: string
): Promise<boolean> {
  const { count } = await admin
    .from('email_notification_log')
    .select('*', { count: 'exact', head: true })
    .eq('trigger_type', triggerType)
    .eq('deliverable_id', deliverableId)
    .eq('recipient_email', recipientEmail)

  return (count ?? 0) > 0
}

async function isWeeklySentThisWeek(
  admin: ReturnType<typeof getAdminClient>,
  recipientEmail: string
): Promise<boolean> {
  // Check if a weekly_risk email was sent in the last 6 days
  const sixDaysAgo = new Date()
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

  const { count } = await admin
    .from('email_notification_log')
    .select('*', { count: 'exact', head: true })
    .eq('trigger_type', 'weekly_risk')
    .eq('recipient_email', recipientEmail)
    .gte('sent_at', sixDaysAgo.toISOString())

  return (count ?? 0) > 0
}

async function isPartnerHealthSentThisWeek(
  admin: ReturnType<typeof getAdminClient>,
  orgId: string,
  recipientEmail: string
): Promise<boolean> {
  const sixDaysAgo = new Date()
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

  const { count } = await admin
    .from('email_notification_log')
    .select('*', { count: 'exact', head: true })
    .eq('trigger_type', 'partner_health')
    .eq('recipient_email', recipientEmail)
    .eq('org_id', orgId)
    .gte('sent_at', sixDaysAgo.toISOString())

  return (count ?? 0) > 0
}

async function logEmailSent(
  admin: ReturnType<typeof getAdminClient>,
  orgId: string,
  triggerType: string,
  deliverableId: string | null,
  recipientEmail: string,
  subject: string
): Promise<void> {
  await admin.from('email_notification_log').insert({
    org_id: orgId,
    trigger_type: triggerType,
    deliverable_id: deliverableId,
    recipient_email: recipientEmail,
    subject,
  })
}

// ---------------------------------------------------------------------------
// Trigger 1: Deliverable due in 48 hours
// ---------------------------------------------------------------------------

async function triggerDueSoon(admin: ReturnType<typeof getAdminClient>): Promise<number> {
  let emailsSent = 0

  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  // Find all deliverables due in the next 48h that aren't done/proved
  const { data: deliverables } = await admin
    .from('deliverables')
    .select('id, title, event_id, partner_id, due_date')
    .not('status', 'in', '("done","pending_approval","proved")')
    .not('due_date', 'is', null)
    .gte('due_date', now.toISOString().split('T')[0])
    .lte('due_date', in48h.toISOString().split('T')[0])

  if (!deliverables || deliverables.length === 0) return 0

  // Group by event to batch-fetch context
  const eventIds = [...new Set(deliverables.map((d) => d.event_id))]
  const partnerIds = [...new Set(deliverables.map((d) => d.partner_id))]

  const [{ data: events }, { data: partners }] = await Promise.all([
    admin.from('events').select('id, name, org_id').in('id', eventIds),
    admin.from('partners').select('id, name').in('id', partnerIds),
  ])

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]))
  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]))

  // Get org → owner mapping
  const orgIds = [...new Set((events ?? []).map((e) => e.org_id))]
  const orgOwners = new Map<string, OrgMemberWithEmail[]>()

  for (const orgId of orgIds) {
    const members = await getOrgMembersWithEmails(admin, orgId, ['owner'])
    orgOwners.set(orgId, members)
  }

  for (const del of deliverables) {
    const event = eventMap.get(del.event_id)
    const partner = partnerMap.get(del.partner_id)
    if (!event || !partner) continue

    const owners = orgOwners.get(event.org_id) ?? []

    for (const owner of owners) {
      if (await isAlreadySent(admin, 'due_soon', del.id, owner.email)) continue

      const subject = dueSoonEmailSubject({ deliverableTitle: del.title, dueDate: formatDate(del.due_date) })
      const html = dueSoonEmailHtml({
        recipientName: owner.name || owner.email.split('@')[0],
        deliverableTitle: del.title,
        partnerName: partner.name,
        eventName: event.name,
        dueDate: formatDate(del.due_date),
        directUrl: deliverableUrl(del.event_id, del.partner_id),
      })

      const sent = await sendEmail({ to: owner.email, subject, html })
      if (sent) {
        await logEmailSent(admin, event.org_id, 'due_soon', del.id, owner.email, subject)
        emailsSent++
      }
    }
  }

  return emailsSent
}

// ---------------------------------------------------------------------------
// Trigger 2: Done but no proof for 24+ hours
// ---------------------------------------------------------------------------

async function triggerNeedsProof(admin: ReturnType<typeof getAdminClient>): Promise<number> {
  let emailsSent = 0

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Find deliverables marked done more than 24h ago
  const { data: deliverables } = await admin
    .from('deliverables')
    .select('id, title, event_id, partner_id, updated_at')
    .eq('status', 'done')
    .lte('updated_at', twentyFourHoursAgo)

  if (!deliverables || deliverables.length === 0) return 0

  // Check which ones actually have no proofs
  const delIds = deliverables.map((d) => d.id)
  const { data: proofRows } = await admin
    .from('proofs')
    .select('deliverable_id')
    .in('deliverable_id', delIds)

  const hasProof = new Set((proofRows ?? []).map((r) => r.deliverable_id))
  const noProofDels = deliverables.filter((d) => !hasProof.has(d.id))

  if (noProofDels.length === 0) return 0

  // Fetch context
  const eventIds = [...new Set(noProofDels.map((d) => d.event_id))]
  const partnerIds = [...new Set(noProofDels.map((d) => d.partner_id))]

  const [{ data: events }, { data: partners }] = await Promise.all([
    admin.from('events').select('id, name, org_id').in('id', eventIds),
    admin.from('partners').select('id, name').in('id', partnerIds),
  ])

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]))
  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]))

  // Get org → owner+admin mapping
  const orgIds = [...new Set((events ?? []).map((e) => e.org_id))]
  const orgRecipients = new Map<string, OrgMemberWithEmail[]>()

  for (const orgId of orgIds) {
    const members = await getOrgMembersWithEmails(admin, orgId, ['owner', 'admin'])
    orgRecipients.set(orgId, members)
  }

  for (const del of noProofDels) {
    const event = eventMap.get(del.event_id)
    const partner = partnerMap.get(del.partner_id)
    if (!event || !partner) continue

    const recipients = orgRecipients.get(event.org_id) ?? []

    for (const recipient of recipients) {
      if (await isAlreadySent(admin, 'needs_proof', del.id, recipient.email)) continue

      const subject = needsProofEmailSubject({ deliverableTitle: del.title })
      const html = needsProofEmailHtml({
        recipientName: recipient.name || recipient.email.split('@')[0],
        deliverableTitle: del.title,
        partnerName: partner.name,
        eventName: event.name,
        directUrl: deliverableUrl(del.event_id, del.partner_id),
      })

      const sent = await sendEmail({ to: recipient.email, subject, html })
      if (sent) {
        await logEmailSent(admin, event.org_id, 'needs_proof', del.id, recipient.email, subject)
        emailsSent++
      }
    }
  }

  return emailsSent
}

// ---------------------------------------------------------------------------
// Trigger 3: Weekly risk summary (Monday mornings only)
// ---------------------------------------------------------------------------

async function triggerWeeklyRisk(admin: ReturnType<typeof getAdminClient>): Promise<number> {
  let emailsSent = 0

  // Only run on Mondays
  const now = new Date()
  if (now.getUTCDay() !== 1) return 0 // 0=Sunday, 1=Monday
  // Only in the morning window (0-11 UTC) to avoid duplicates from multiple hourly runs
  if (now.getUTCHours() > 11) return 0

  // Get all orgs
  const { data: orgs } = await admin.from('organizations').select('id, name')
  if (!orgs || orgs.length === 0) return 0

  const today = new Date(now.toISOString().split('T')[0])
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  for (const org of orgs) {
    // Get events for this org
    const { data: events } = await admin
      .from('events')
      .select('id, name, date')
      .eq('org_id', org.id)
      .in('status', ['upcoming', 'active'])

    if (!events || events.length === 0) continue

    const eventIds = events.map((e) => e.id)

    // Get all deliverables for these events
    const { data: deliverables } = await admin
      .from('deliverables')
      .select('id, event_id, status, due_date, updated_at')
      .in('event_id', eventIds)

    if (!deliverables || deliverables.length === 0) continue

    // Get proof counts for done deliverables
    const doneIds = deliverables.filter((d) => d.status === 'done').map((d) => d.id)
    const hasProof = new Set<string>()

    if (doneIds.length > 0) {
      const { data: proofRows } = await admin
        .from('proofs')
        .select('deliverable_id')
        .in('deliverable_id', doneIds)

      for (const r of proofRows ?? []) {
        hasProof.add(r.deliverable_id)
      }
    }

    // Compute per-event risk
    const eventRisks = events.map((event) => {
      const eventDels = deliverables.filter((d) => d.event_id === event.id)

      const overdueCount = eventDels.filter((d) =>
        d.due_date &&
        d.status !== 'done' && d.status !== 'pending_approval' && d.status !== 'proved' &&
        new Date(d.due_date) < today
      ).length

      const needsProofCount = eventDels.filter((d) =>
        d.status === 'done' && !hasProof.has(d.id)
      ).length

      const upcomingDueCount = eventDels.filter((d) =>
        d.due_date &&
        d.status !== 'done' && d.status !== 'pending_approval' && d.status !== 'proved' &&
        new Date(d.due_date) >= today &&
        new Date(d.due_date) <= in7Days
      ).length

      return {
        eventName: event.name,
        eventDate: event.date ? formatDate(event.date) : null,
        overdueCount,
        needsProofCount,
        upcomingDueCount,
      }
    })

    // Only send if there's something to report
    const hasAnyRisk = eventRisks.some((e) => e.overdueCount > 0 || e.needsProofCount > 0 || e.upcomingDueCount > 0)
    if (!hasAnyRisk) continue

    // Email admins + owner
    const recipients = await getOrgMembersWithEmails(admin, org.id, ['owner', 'admin'])

    for (const recipient of recipients) {
      if (await isWeeklySentThisWeek(admin, recipient.email)) continue

      const subject = weeklyRiskEmailSubject({ orgName: org.name })
      const html = weeklyRiskEmailHtml({
        recipientName: recipient.name || recipient.email.split('@')[0],
        orgName: org.name,
        events: eventRisks,
        dashboardUrl: `${BASE_URL}/dashboard`,
      })

      const sent = await sendEmail({ to: recipient.email, subject, html })
      if (sent) {
        await logEmailSent(admin, org.id, 'weekly_risk', null, recipient.email, subject)
        emailsSent++
      }
    }
  }

  return emailsSent
}

// ---------------------------------------------------------------------------
// Trigger 4: Pre-event scan (72h out)
// Flag deliverables with no owner or still not_started
// ---------------------------------------------------------------------------

async function triggerPreEventScan(admin: ReturnType<typeof getAdminClient>): Promise<number> {
  let emailsSent = 0

  const now = new Date()
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000)

  // Events with a date in the next 72 hours
  const { data: events } = await admin
    .from('events')
    .select('id, name, date, org_id')
    .in('status', ['upcoming', 'active'])
    .not('date', 'is', null)
    .gte('date', now.toISOString().split('T')[0])
    .lte('date', in72h.toISOString().split('T')[0])

  if (!events || events.length === 0) return 0

  for (const event of events) {
    // Get deliverables that are no-owner OR not_started
    const { data: deliverables } = await admin
      .from('deliverables')
      .select('id, title, partner_id, status, owner_id')
      .eq('event_id', event.id)
      .not('status', 'in', '("done","pending_approval","proved")')

    if (!deliverables || deliverables.length === 0) continue

    // Flag: no owner assigned OR still not_started
    const flagged = deliverables.filter(
      (d) => !d.owner_id || d.status === 'not_started'
    )

    if (flagged.length === 0) continue

    // Get partner names
    const partnerIds = [...new Set(flagged.map((d) => d.partner_id))]
    const { data: partners } = await admin
      .from('partners')
      .select('id, name')
      .in('id', partnerIds)

    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p.name]))

    const flaggedItems = flagged.map((d) => ({
      title: d.title,
      partnerName: partnerMap.get(d.partner_id) ?? 'Unknown',
      reason: (!d.owner_id ? 'no_owner' : 'not_started') as 'no_owner' | 'not_started',
    }))

    // Email owner + admins
    const recipients = await getOrgMembersWithEmails(admin, event.org_id, ['owner', 'admin'])

    for (const recipient of recipients) {
      // Dedup key: pre_event_scan + event.id per recipient
      if (await isAlreadySent(admin, 'pre_event_scan', event.id, recipient.email)) continue

      const subject = preEventScanEmailSubject({ eventName: event.name })
      const html = preEventScanEmailHtml({
        recipientName: recipient.name || recipient.email.split('@')[0],
        eventName: event.name,
        eventDate: formatDate(event.date),
        hoursUntil: 72,
        flaggedItems,
        eventUrl: `${BASE_URL}/events/${event.id}`,
      })

      const sent = await sendEmail({ to: recipient.email, subject, html })
      if (sent) {
        await logEmailSent(admin, event.org_id, 'pre_event_scan', event.id, recipient.email, subject)
        emailsSent++
      }
    }

    // Group flagged items by partner for context-rich notifications
    const byPartner = new Map<string, typeof flaggedItems>()
    for (const item of flaggedItems) {
      const arr = byPartner.get(item.partnerName) ?? []
      arr.push(item)
      byPartner.set(item.partnerName, arr)
    }

    const partnerLines = [...byPartner.entries()].slice(0, 3).map(([name, items]) => {
      const titles = items.map((i) => i.title).slice(0, 3).join(', ')
      const more = items.length > 3 ? ` +${items.length - 3} more` : ''
      return `${name}: ${titles}${more}`
    })

    const relTime = relativeEventTime(event.date ?? '')

    // In-app notifications for all org members
    const allMembers = await getOrgMembersWithEmails(admin, event.org_id)
    for (const member of allMembers) {
      await admin.from('notifications').insert({
        user_id: member.user_id,
        org_id: event.org_id,
        type: 'pre_event_scan',
        title: `${event.name}: ${flagged.length} deliverable${flagged.length !== 1 ? 's' : ''} need attention`,
        body: `${relTime}. ${partnerLines.join('; ')}`,
        link: `/events/${event.id}`,
        metadata: {
          event_id: event.id,
          flagged_count: flagged.length,
          severity: flagged.length > 5 ? 'red' : 'yellow',
        },
      })
    }
  }

  return emailsSent
}

// ---------------------------------------------------------------------------
// Trigger 5: Post-event scan (24h after)
// Flag deliverables that are done but have no proof
// ---------------------------------------------------------------------------

async function triggerPostEventScan(admin: ReturnType<typeof getAdminClient>): Promise<number> {
  let emailsSent = 0

  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  // Events that ended 24-48h ago (date window to avoid repeat scans)
  const { data: events } = await admin
    .from('events')
    .select('id, name, date, org_id')
    .not('date', 'is', null)
    .lte('date', twentyFourHoursAgo.toISOString().split('T')[0])
    .gte('date', fortyEightHoursAgo.toISOString().split('T')[0])

  if (!events || events.length === 0) return 0

  for (const event of events) {
    // Get "done" deliverables (not "proved")
    const { data: doneDels } = await admin
      .from('deliverables')
      .select('id, title, partner_id')
      .eq('event_id', event.id)
      .eq('status', 'done')

    if (!doneDels || doneDels.length === 0) continue

    // Also fetch ALL deliverables for per-partner totals
    const { data: allEventDels } = await admin
      .from('deliverables')
      .select('id, partner_id')
      .eq('event_id', event.id)

    const totalByPartner = new Map<string, number>()
    for (const d of allEventDels ?? []) {
      totalByPartner.set(d.partner_id, (totalByPartner.get(d.partner_id) ?? 0) + 1)
    }

    // Check which have zero proofs
    const delIds = doneDels.map((d) => d.id)
    const { data: proofRows } = await admin
      .from('proofs')
      .select('deliverable_id')
      .in('deliverable_id', delIds)

    const hasProof = new Set((proofRows ?? []).map((r) => r.deliverable_id))
    const unproved = doneDels.filter((d) => !hasProof.has(d.id))

    if (unproved.length === 0) continue

    // Get partner names
    const partnerIds = [...new Set(unproved.map((d) => d.partner_id))]
    const { data: partners } = await admin
      .from('partners')
      .select('id, name')
      .in('id', partnerIds)

    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p.name]))

    // Group unproved by partner
    const partnerGroups = new Map<string, { partnerName: string; total: number; items: { title: string }[] }>()
    for (const d of unproved) {
      const existing = partnerGroups.get(d.partner_id)
      if (existing) {
        existing.items.push({ title: d.title })
      } else {
        partnerGroups.set(d.partner_id, {
          partnerName: partnerMap.get(d.partner_id) ?? 'Unknown',
          total: totalByPartner.get(d.partner_id) ?? 0,
          items: [{ title: d.title }],
        })
      }
    }

    const partnerAlerts = [...partnerGroups.entries()].map(([, group]) => ({
      partnerName: group.partnerName,
      totalDeliverables: group.total,
      unprovedItems: group.items,
    }))

    const relTime = relativeEventTime(event.date ?? '')

    // Email owner + admins
    const recipients = await getOrgMembersWithEmails(admin, event.org_id, ['owner', 'admin'])

    for (const recipient of recipients) {
      if (await isAlreadySent(admin, 'post_event_scan', event.id, recipient.email)) continue

      const subject = postEventScanEmailSubject({ eventName: event.name })
      const html = postEventScanEmailHtml({
        recipientName: recipient.name || recipient.email.split('@')[0],
        eventName: event.name,
        eventDate: formatDate(event.date),
        partnerAlerts,
        eventUrl: `${BASE_URL}/events/${event.id}`,
      })

      const sent = await sendEmail({ to: recipient.email, subject, html })
      if (sent) {
        await logEmailSent(admin, event.org_id, 'post_event_scan', event.id, recipient.email, subject)
        emailsSent++
      }
    }

    // Context-rich in-app notifications
    const partnerSummaries = partnerAlerts
      .slice(0, 3)
      .map((pa) => {
        const missing = pa.unprovedItems.map((i) => i.title).slice(0, 3).join(', ')
        const more = pa.unprovedItems.length > 3 ? ` +${pa.unprovedItems.length - 3} more` : ''
        return `${pa.partnerName}: ${pa.unprovedItems.length}/${pa.totalDeliverables} unproved. Missing: ${missing}${more}`
      })

    const allMembers = await getOrgMembersWithEmails(admin, event.org_id)
    for (const member of allMembers) {
      await admin.from('notifications').insert({
        user_id: member.user_id,
        org_id: event.org_id,
        type: 'post_event_scan',
        title: `${event.name}: ${unproved.length} deliverable${unproved.length !== 1 ? 's' : ''} need proof`,
        body: `${partnerSummaries.join('\n')}\n${relTime}.`,
        link: `/events/${event.id}`,
        metadata: {
          event_id: event.id,
          unproved_count: unproved.length,
          severity: unproved.length > 5 ? 'red' : 'yellow',
        },
      })
    }
  }

  return emailsSent
}

// ---------------------------------------------------------------------------
// Trigger 6: Partner health — flag partners below 70% completion (weekly)
// ---------------------------------------------------------------------------

async function triggerPartnerHealth(admin: ReturnType<typeof getAdminClient>): Promise<number> {
  let emailsSent = 0

  // Get all orgs
  const { data: orgs } = await admin.from('organizations').select('id, name')
  if (!orgs || orgs.length === 0) return 0

  for (const org of orgs) {
    // Get active/upcoming events
    const { data: events } = await admin
      .from('events')
      .select('id')
      .eq('org_id', org.id)
      .in('status', ['upcoming', 'active'])

    if (!events || events.length === 0) continue

    const eventIds = events.map((e) => e.id)

    // Get all partners for these events
    const { data: partners } = await admin
      .from('partners')
      .select('id, name, deal_value')
      .in('event_id', eventIds)

    if (!partners || partners.length === 0) continue

    const partnerIds = partners.map((p) => p.id)

    // Get all deliverables for these partners (include title for context-rich alerts)
    const { data: deliverables } = await admin
      .from('deliverables')
      .select('id, title, partner_id, status, due_date')
      .in('partner_id', partnerIds)

    if (!deliverables || deliverables.length === 0) continue

    const today = new Date().toISOString().split('T')[0]

    // Compute per-partner stats with deliverable names
    const unhealthyPartners = partners
      .map((p) => {
        const pDels = deliverables.filter((d) => d.partner_id === p.id)
        if (pDels.length === 0) return null

        const completed = pDels.filter((d) => d.status === 'done' || d.status === 'pending_approval' || d.status === 'proved').length
        const pct = Math.round((completed / pDels.length) * 100)

        if (pct >= 70) return null

        const incompleteDels = pDels.filter(
          (d) => d.status !== 'done' && d.status !== 'pending_approval' && d.status !== 'proved'
        )
        const overdueCount = incompleteDels.filter(
          (d) => d.due_date && d.due_date < today
        ).length

        return {
          name: p.name,
          completionPct: pct,
          overdueCount,
          totalDeliverables: pDels.length,
          completedDeliverables: completed,
          dealValue: p.deal_value ?? 0,
          missingTitles: incompleteDels.map((d) => d.title).slice(0, 5),
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.completionPct - b.completionPct)

    if (unhealthyPartners.length === 0) continue

    // Email owner + admins (weekly dedup)
    const recipients = await getOrgMembersWithEmails(admin, org.id, ['owner', 'admin'])

    for (const recipient of recipients) {
      if (await isPartnerHealthSentThisWeek(admin, org.id, recipient.email)) continue

      const subject = partnerHealthEmailSubject({ count: unhealthyPartners.length })
      const html = partnerHealthEmailHtml({
        recipientName: recipient.name || recipient.email.split('@')[0],
        orgName: org.name,
        partners: unhealthyPartners,
        dashboardUrl: `${BASE_URL}/partners`,
      })

      const sent = await sendEmail({ to: recipient.email, subject, html })
      if (sent) {
        await logEmailSent(admin, org.id, 'partner_health', null, recipient.email, subject)
        emailsSent++
      }
    }

    // Context-rich in-app notifications for all org members
    const summaryBody = unhealthyPartners.slice(0, 3).map((p) => {
      const missing = p.missingTitles.slice(0, 3).join(', ')
      const more = p.missingTitles.length > 3 ? ` +${p.missingTitles.length - 3} more` : ''
      return `${p.name}: ${p.completedDeliverables}/${p.totalDeliverables} complete. Missing: ${missing}${more}`
    }).join('\n')

    const allMembers = await getOrgMembersWithEmails(admin, org.id)
    for (const member of allMembers) {
      await admin.from('notifications').insert({
        user_id: member.user_id,
        org_id: org.id,
        type: 'partner_health',
        title: `${unhealthyPartners.length} partner${unhealthyPartners.length !== 1 ? 's' : ''} below 70% fulfillment`,
        body: summaryBody,
        link: '/partners',
        metadata: {
          partner_count: unhealthyPartners.length,
          severity: unhealthyPartners.some((p) => p.completionPct < 40) ? 'red' : 'yellow',
        },
      })
    }
  }

  return emailsSent
}

// ---------------------------------------------------------------------------
// Trigger 7: Usage rights expiring in ~30 days
// ---------------------------------------------------------------------------

async function triggerUsageRightsExpiring(admin: ReturnType<typeof getAdminClient>): Promise<number> {
  let emailsSent = 0

  // 2-day window around 30 days out to handle hourly cron runs without duplicating
  const in29Days = new Date(Date.now() + 29 * 86_400_000).toISOString().split('T')[0]
  const in31Days = new Date(Date.now() + 31 * 86_400_000).toISOString().split('T')[0]

  const { data: deliverables } = await admin
    .from('deliverables')
    .select('id, title, event_id, partner_id, usage_expiration_date, talent_id, owner_id')
    .eq('category', 'talent')
    .not('usage_expiration_date', 'is', null)
    .gte('usage_expiration_date', in29Days)
    .lt('usage_expiration_date', in31Days)

  if (!deliverables || deliverables.length === 0) return 0

  // Fetch context
  const eventIds = [...new Set(deliverables.map((d: { event_id: string }) => d.event_id))]
  const partnerIds = [...new Set(deliverables.map((d: { partner_id: string }) => d.partner_id))]
  const talentIds = deliverables.map((d: { talent_id: string | null }) => d.talent_id).filter(Boolean) as string[]

  const [{ data: events }, { data: partners }, talentResult] = await Promise.all([
    admin.from('events').select('id, name, org_id').in('id', eventIds),
    admin.from('partners').select('id, name').in('id', partnerIds),
    talentIds.length > 0
      ? admin.from('talent').select('id, name').in('id', [...new Set(talentIds)])
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const eventMap = new Map((events ?? []).map((e: { id: string; name: string; org_id: string }) => [e.id, e]))
  const partnerMap = new Map((partners ?? []).map((p: { id: string; name: string }) => [p.id, p]))
  const talentMap = new Map((talentResult.data ?? []).map((t: { id: string; name: string }) => [t.id, t.name]))

  for (const del of deliverables as Array<{ id: string; title: string; event_id: string; partner_id: string; usage_expiration_date: string; talent_id: string | null; owner_id: string | null }>) {
    const event = eventMap.get(del.event_id)
    const partner = partnerMap.get(del.partner_id)
    if (!event || !partner) continue

    const talentName = del.talent_id ? (talentMap.get(del.talent_id) ?? null) : null
    const daysRemaining = Math.ceil((new Date(del.usage_expiration_date).getTime() - Date.now()) / 86_400_000)

    // Email admins/owners
    const recipients = await getOrgMembersWithEmails(admin, event.org_id, ['owner', 'admin'])

    for (const recipient of recipients) {
      if (await isAlreadySent(admin, 'usage_rights_expiring', del.id, recipient.email)) continue

      const subject = usageRightsExpiringEmailSubject({ deliverableTitle: del.title })
      const html = usageRightsExpiringEmailHtml({
        recipientName: recipient.name || recipient.email.split('@')[0],
        deliverableTitle: del.title,
        talentName,
        partnerName: partner.name,
        eventName: event.name,
        expirationDate: formatDate(del.usage_expiration_date),
        daysRemaining,
        directUrl: `${BASE_URL}/events/${del.event_id}/partners/${del.partner_id}/deliverables/${del.id}`,
      })

      const sent = await sendEmail({ to: recipient.email, subject, html })
      if (sent) {
        await logEmailSent(admin, event.org_id, 'usage_rights_expiring', del.id, recipient.email, subject)
        emailsSent++
      }
    }

    // In-app notifications for all org members
    const allMembers = await getOrgMembersWithEmails(admin, event.org_id)
    for (const member of allMembers) {
      await admin.from('notifications').insert({
        user_id: member.user_id,
        org_id: event.org_id,
        type: 'usage_rights_expiring',
        title: `Usage rights expiring in ${daysRemaining} days: ${del.title}`,
        body: talentName
          ? `${talentName} \u00b7 ${partner.name} \u00b7 Expires ${formatDate(del.usage_expiration_date)}`
          : `${partner.name} \u00b7 Expires ${formatDate(del.usage_expiration_date)}`,
        link: `/events/${del.event_id}/partners/${del.partner_id}/deliverables/${del.id}`,
        metadata: {
          deliverable_id: del.id,
          expiration_date: del.usage_expiration_date,
          severity: 'amber',
        },
      })
    }
  }

  return emailsSent
}

// ---------------------------------------------------------------------------
// Trigger 8: Webhook delivery retries
// ---------------------------------------------------------------------------

// Backoff schedule: minutes to wait before retry at each attempt number
const BACKOFF_MINUTES = [0, 1, 5, 30, 120, 1440]

async function triggerWebhookRetries(admin: ReturnType<typeof getAdminClient>): Promise<number> {
  let retryCount = 0

  // Fetch failed deliveries from the last 24h that haven't exhausted retries
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: failedLogs } = await admin
    .from('webhook_delivery_log')
    .select('id, webhook_id, org_id, event_type, payload, attempt_number, original_delivery_id, created_at')
    .eq('success', false)
    .eq('retries_exhausted', false)
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!failedLogs || failedLogs.length === 0) return 0

  // Deduplicate: keep only the latest attempt per chain
  const latestByChain = new Map<string, typeof failedLogs[number]>()
  for (const log of failedLogs) {
    const chainId = log.original_delivery_id ?? log.id
    if (!latestByChain.has(chainId)) {
      latestByChain.set(chainId, log)
    }
  }

  const now = Date.now()

  for (const log of latestByChain.values()) {
    // Backoff check: skip if too recent for this attempt number
    const backoffIdx = Math.min(log.attempt_number, BACKOFF_MINUTES.length - 1)
    const minWaitMs = BACKOFF_MINUTES[backoffIdx] * 60 * 1000
    const logAge = now - new Date(log.created_at).getTime()

    if (logAge < minWaitMs) continue

    try {
      await retryDelivery(admin, log)
      retryCount++
    } catch (err) {
      console.error('[Cron] Webhook retry failed:', err)
    }
  }

  return retryCount
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getAdminClient()
    const startTime = Date.now()

    const [dueSoonCount, needsProofCount, weeklyRiskCount, preEventCount, postEventCount, partnerHealthCount, usageRightsCount, webhookRetryCount] = await Promise.all([
      triggerDueSoon(admin),
      triggerNeedsProof(admin),
      triggerWeeklyRisk(admin),
      triggerPreEventScan(admin),
      triggerPostEventScan(admin),
      triggerPartnerHealth(admin),
      triggerUsageRightsExpiring(admin),
      triggerWebhookRetries(admin),
    ])

    const duration = Date.now() - startTime
    const total = dueSoonCount + needsProofCount + weeklyRiskCount + preEventCount + postEventCount + partnerHealthCount + usageRightsCount

    console.log(`[Cron] Notification run complete in ${duration}ms — due_soon: ${dueSoonCount}, needs_proof: ${needsProofCount}, weekly_risk: ${weeklyRiskCount}, pre_event: ${preEventCount}, post_event: ${postEventCount}, partner_health: ${partnerHealthCount}, usage_rights_expiring: ${usageRightsCount}, webhook_retries: ${webhookRetryCount}`)

    return NextResponse.json({
      ok: true,
      emails_sent: {
        due_soon: dueSoonCount,
        needs_proof: needsProofCount,
        weekly_risk: weeklyRiskCount,
        pre_event_scan: preEventCount,
        post_event_scan: postEventCount,
        partner_health: partnerHealthCount,
        usage_rights_expiring: usageRightsCount,
        total,
      },
      webhook_retries: webhookRetryCount,
      duration_ms: duration,
    })
  } catch (err) {
    console.error('[Cron] Notification error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
