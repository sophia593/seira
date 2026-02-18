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
 *
 * All emails are logged to `email_notification_log` for deduplication.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/send'
import { dueSoonEmailSubject, dueSoonEmailHtml } from '@/lib/email/templates/due-soon'
import { needsProofEmailSubject, needsProofEmailHtml } from '@/lib/email/templates/needs-proof'
import { weeklyRiskEmailSubject, weeklyRiskEmailHtml } from '@/lib/email/templates/weekly-risk-summary'

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
    .not('status', 'in', '("done","proved")')
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
        d.status !== 'done' && d.status !== 'proved' &&
        new Date(d.due_date) < today
      ).length

      const needsProofCount = eventDels.filter((d) =>
        d.status === 'done' && !hasProof.has(d.id)
      ).length

      const upcomingDueCount = eventDels.filter((d) =>
        d.due_date &&
        d.status !== 'done' && d.status !== 'proved' &&
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
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getAdminClient()
    const startTime = Date.now()

    const [dueSoonCount, needsProofCount, weeklyRiskCount] = await Promise.all([
      triggerDueSoon(admin),
      triggerNeedsProof(admin),
      triggerWeeklyRisk(admin),
    ])

    const duration = Date.now() - startTime

    console.log(`[Cron] Notification run complete in ${duration}ms — due_soon: ${dueSoonCount}, needs_proof: ${needsProofCount}, weekly_risk: ${weeklyRiskCount}`)

    return NextResponse.json({
      ok: true,
      emails_sent: {
        due_soon: dueSoonCount,
        needs_proof: needsProofCount,
        weekly_risk: weeklyRiskCount,
        total: dueSoonCount + needsProofCount + weeklyRiskCount,
      },
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
