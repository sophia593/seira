'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import {
  createDeliverable,
  updateDeliverable,
  updateDeliverableStatus,
  deleteDeliverable,
  listDeliverablesByPartner,
  bulkUpdateDeliverableStatus,
  rejectDeliverable,
  clearRejectionNote,
} from '@/lib/db/deliverables'
import { getDeliverableById } from '@/lib/db/deliverables'
import { getPartnerById } from '@/lib/db/partners'
import { getEventById } from '@/lib/db/events'
import { countProofByDeliverable } from '@/lib/db/proof'
import { getOrgAdminsWithEmails } from '@/lib/db/org-members'
import { sendEmail } from '@/lib/email/send'
import { proofReminderEmailSubject, proofReminderEmailHtml } from '@/lib/email/templates/proof-reminder'
import { partnerReminderEmailSubject, partnerReminderEmailHtml } from '@/lib/email/templates/partner-reminder'
import type { PartnerReminderItem } from '@/lib/email/templates/partner-reminder'
import { isUuid } from '@/lib/validation'
import { canEditContent, canManageContent } from '@/lib/permissions'
import type { DeliverableCategory, DeliverableStatus, OrgRole, OrgSettings, ProofRequired, TalentType, UsageScope, UsageTerritory, UsageDuration } from '@/lib/types/database'
import { logActivity } from '@/lib/db/activity-log'
import { fireWebhook } from '@/lib/webhooks/dispatch'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/db/notifications'
import { requiresApproval } from '@/lib/approval'
import { CATEGORIES, CATEGORY_CONFIG, TALENT_TYPES, STATUS_FLOW, PROOF_REQUIRED_OPTIONS, isOverdue, USAGE_SCOPES, USAGE_TERRITORIES, USAGE_DURATIONS, computeExpirationDate } from '@/lib/constants'

async function getAuthenticatedOrg() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const membership = await getUserMembership(supabase, user.id)
  if (!membership) {
    return { error: 'No organization membership' }
  }

  return { orgId: membership.org_id, role: membership.role as OrgRole, userId: user.id, userEmail: user.email ?? '' }
}

function str(formData: FormData, key: string): string | undefined {
  const val = formData.get(key)
  if (typeof val !== 'string' || val.trim() === '') return undefined
  return val.trim()
}

export async function createDeliverableAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const partnerId = str(formData, 'partner_id')
    if (!partnerId || !isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const eventId = str(formData, 'event_id')
    if (!eventId || !isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }

    const title = str(formData, 'title')
    if (!title) return { ok: false, error: 'Title is required' }

    const category = str(formData, 'category') as DeliverableCategory | undefined
    if (!category || !CATEGORIES.includes(category)) {
      return { ok: false, error: 'Valid category is required' }
    }

    const proofRequired = str(formData, 'proof_required') as ProofRequired | undefined
    if (proofRequired && !PROOF_REQUIRED_OPTIONS.includes(proofRequired)) {
      return { ok: false, error: 'Invalid proof required type' }
    }

    const talentSubType = str(formData, 'talent_sub_type') as TalentType | undefined
    if (talentSubType && !TALENT_TYPES.includes(talentSubType)) {
      return { ok: false, error: 'Invalid talent sub-type' }
    }

    const talentId = str(formData, 'talent_id')
    if (talentId && !isUuid(talentId)) {
      return { ok: false, error: 'Invalid talent ID' }
    }

    const assetId = str(formData, 'asset_id')
    if (assetId && !isUuid(assetId)) {
      return { ok: false, error: 'Invalid asset' }
    }

    // Usage rights fields (talent only)
    let usageScope: UsageScope | undefined
    let usageTerritory: UsageTerritory | undefined
    let usageDuration: UsageDuration | undefined
    let usageExpirationDate: string | undefined
    let usageScopeCustom: string | undefined
    let usageTerritoryCustom: string | undefined

    if (category === 'talent') {
      const rawScope = str(formData, 'usage_scope') as UsageScope | undefined
      if (rawScope && USAGE_SCOPES.includes(rawScope)) usageScope = rawScope
      const rawTerritory = str(formData, 'usage_territory') as UsageTerritory | undefined
      if (rawTerritory && USAGE_TERRITORIES.includes(rawTerritory)) usageTerritory = rawTerritory
      const rawDuration = str(formData, 'usage_duration') as UsageDuration | undefined
      if (rawDuration && USAGE_DURATIONS.includes(rawDuration)) usageDuration = rawDuration

      usageScopeCustom = usageScope === 'custom' ? str(formData, 'usage_scope_custom') : undefined
      usageTerritoryCustom = usageTerritory === 'custom' ? str(formData, 'usage_territory_custom') : undefined

      // Auto-calc expiration date from event date + duration
      if (usageDuration && usageDuration !== 'custom' && usageDuration !== 'perpetual') {
        const event = await getEventById(eventId)
        if (event?.date) {
          usageExpirationDate = computeExpirationDate(event.date, usageDuration) ?? undefined
        }
      } else if (usageDuration === 'custom') {
        usageExpirationDate = str(formData, 'usage_expiration_date')
      }
    }

    const deliverable = await createDeliverable({
      partner_id: partnerId,
      event_id: eventId,
      title,
      category,
      due_date: str(formData, 'due_date'),
      proof_required: proofRequired,
      talent_sub_type: category === 'talent' ? talentSubType : undefined,
      talent_id: category === 'talent' ? (talentId || undefined) : undefined,
      asset_id: assetId || undefined,
      notes: str(formData, 'notes'),
      usage_scope: usageScope,
      usage_territory: usageTerritory,
      usage_duration: usageDuration,
      usage_expiration_date: usageExpirationDate,
      usage_scope_custom: usageScopeCustom,
      usage_territory_custom: usageTerritoryCustom,
    })

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'created', targetType: 'deliverable', targetId: deliverable.id, eventId, details: { title, partner_id: partnerId, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverable.id}`)

    return { ok: true, id: deliverable.id }
  } catch (err) {
    console.error('createDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create deliverable' }
  }
}

export async function updateDeliverableAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    const title = str(formData, 'title')
    if (!title) return { ok: false, error: 'Title is required' }

    const category = str(formData, 'category') as DeliverableCategory | undefined
    if (!category || !CATEGORIES.includes(category)) {
      return { ok: false, error: 'Valid category is required' }
    }

    const proofRequired = str(formData, 'proof_required') as ProofRequired | undefined
    if (proofRequired && !PROOF_REQUIRED_OPTIONS.includes(proofRequired)) {
      return { ok: false, error: 'Invalid proof required type' }
    }

    const talentSubType = str(formData, 'talent_sub_type') as TalentType | undefined

    const talentId = str(formData, 'talent_id')
    if (talentId && !isUuid(talentId)) {
      return { ok: false, error: 'Invalid talent ID' }
    }

    const assetId = str(formData, 'asset_id')
    if (assetId && !isUuid(assetId)) {
      return { ok: false, error: 'Invalid asset' }
    }

    // Usage rights fields (talent only)
    let usageScope: UsageScope | undefined
    let usageTerritory: UsageTerritory | undefined
    let usageDuration: UsageDuration | undefined
    let usageExpirationDate: string | undefined
    let usageScopeCustom: string | undefined
    let usageTerritoryCustom: string | undefined

    if (category === 'talent') {
      const rawScope = str(formData, 'usage_scope') as UsageScope | undefined
      if (rawScope && USAGE_SCOPES.includes(rawScope)) usageScope = rawScope
      const rawTerritory = str(formData, 'usage_territory') as UsageTerritory | undefined
      if (rawTerritory && USAGE_TERRITORIES.includes(rawTerritory)) usageTerritory = rawTerritory
      const rawDuration = str(formData, 'usage_duration') as UsageDuration | undefined
      if (rawDuration && USAGE_DURATIONS.includes(rawDuration)) usageDuration = rawDuration

      usageScopeCustom = usageScope === 'custom' ? str(formData, 'usage_scope_custom') : undefined
      usageTerritoryCustom = usageTerritory === 'custom' ? str(formData, 'usage_territory_custom') : undefined

      if (usageDuration && usageDuration !== 'custom' && usageDuration !== 'perpetual') {
        const event = await getEventById(eventId)
        if (event?.date) {
          usageExpirationDate = computeExpirationDate(event.date, usageDuration) ?? undefined
        }
      } else if (usageDuration === 'custom') {
        usageExpirationDate = str(formData, 'usage_expiration_date')
      }
    }

    await updateDeliverable(deliverableId, {
      title,
      category,
      due_date: str(formData, 'due_date'),
      proof_required: proofRequired,
      talent_sub_type: category === 'talent' ? talentSubType : undefined,
      talent_id: category === 'talent' ? (talentId || undefined) : undefined,
      asset_id: assetId || undefined,
      notes: str(formData, 'notes'),
      usage_scope: category === 'talent' ? usageScope : undefined,
      usage_territory: category === 'talent' ? usageTerritory : undefined,
      usage_duration: category === 'talent' ? usageDuration : undefined,
      usage_expiration_date: category === 'talent' ? usageExpirationDate : undefined,
      usage_scope_custom: category === 'talent' ? usageScopeCustom : undefined,
      usage_territory_custom: category === 'talent' ? usageTerritoryCustom : undefined,
    })

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'updated', targetType: 'deliverable', targetId: deliverableId, eventId, details: { title, partner_id: partnerId, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('updateDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update deliverable' }
  }
}

export async function advanceDeliverableStatusAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
  newStatus: DeliverableStatus
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    if (!STATUS_FLOW.includes(newStatus)) {
      return { ok: false, error: 'Invalid status' }
    }

    // Guard: only admins can approve deliverables that require approval (pending_approval → proved)
    if (newStatus === 'proved') {
      const deliverable = await getDeliverableById(deliverableId)
      if (deliverable?.status === 'pending_approval') {
        const adminClient = tryCreateAdminClient()
        let orgSettings: OrgSettings | null = null
        if (adminClient) {
          const { data: orgRow } = await adminClient.from('organizations').select('settings').eq('id', auth.orgId).single()
          orgSettings = (orgRow?.settings ?? {}) as OrgSettings
        }
        if (requiresApproval(deliverable.category, orgSettings) && !canManageContent(auth.role)) {
          return { ok: false, error: 'Only admins can approve deliverables that require approval' }
        }
      }
    }

    await updateDeliverableStatus(deliverableId, newStatus)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'status_changed', targetType: 'deliverable', targetId: deliverableId, eventId, details: { to: newStatus, partner_id: partnerId, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('advanceDeliverableStatusAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update status' }
  }
}

export async function deleteDeliverableAction(
  deliverableId: string,
  eventId: string,
  partnerId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'You do not have permission to perform this action' }

    await deleteDeliverable(deliverableId)

    logActivity({ orgId: auth.orgId, userId: auth.userId, action: 'deleted', targetType: 'deliverable', targetId: deliverableId, eventId, details: { partner_id: partnerId, actor_email: auth.userEmail } })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('deleteDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete deliverable' }
  }
}

// =============================================================================
// Quick actions
// =============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendProofReminderAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId) || !isUuid(eventId) || !isUuid(partnerId)) {
      return { ok: false, error: 'Invalid ID' }
    }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'Permission denied' }

    const deliverable = await getDeliverableById(deliverableId)
    if (!deliverable) return { ok: false, error: 'Deliverable not found' }
    if (deliverable.status !== 'done') return { ok: false, error: 'Only "done" deliverables need proof reminders' }

    const proofCounts = await countProofByDeliverable([deliverableId])
    if ((proofCounts[deliverableId] ?? 0) > 0) return { ok: false, error: 'Proof already uploaded' }

    const [partner, event, recipients] = await Promise.all([
      getPartnerById(partnerId),
      getEventById(eventId),
      getOrgAdminsWithEmails(auth.orgId),
    ])

    const directUrl = `${BASE_URL}/events/${eventId}/partners/${partnerId}`

    for (const r of recipients) {
      sendEmail({
        to: r.email,
        subject: proofReminderEmailSubject({ deliverableTitle: deliverable.title }),
        html: proofReminderEmailHtml({
          recipientName: r.name ?? r.email,
          deliverableTitle: deliverable.title,
          partnerName: partner?.name ?? 'Unknown',
          eventName: event?.name ?? 'Unknown',
          directUrl,
          senderName: auth.userEmail,
        }),
      })
    }

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'updated',
      targetType: 'deliverable',
      targetId: deliverableId,
      eventId,
      details: { reminder: 'proof', partner_id: partnerId, actor_email: auth.userEmail },
    })

    return { ok: true }
  } catch (err) {
    console.error('sendProofReminderAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to send reminder' }
  }
}

export async function sendPartnerReminderAction(
  eventId: string,
  partnerId: string,
): Promise<{ ok: boolean; error?: string; count?: number }> {
  try {
    if (!isUuid(eventId) || !isUuid(partnerId)) return { ok: false, error: 'Invalid ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'Permission denied' }

    const deliverables = await listDeliverablesByPartner(partnerId)
    if (deliverables.length === 0) return { ok: false, error: 'No deliverables' }

    const proofCounts = await countProofByDeliverable(deliverables.map((d) => d.id))

    const items: PartnerReminderItem[] = []
    for (const d of deliverables) {
      if (isOverdue(d.status, d.due_date)) {
        items.push({ title: d.title, category: CATEGORY_CONFIG[d.category].label, dueDate: d.due_date, issue: 'overdue' })
      } else if (d.status === 'done' && (proofCounts[d.id] ?? 0) === 0) {
        items.push({ title: d.title, category: CATEGORY_CONFIG[d.category].label, dueDate: d.due_date, issue: 'needs_proof' })
      }
    }

    if (items.length === 0) return { ok: false, error: 'No deliverables need attention' }

    const [partner, event, recipients] = await Promise.all([
      getPartnerById(partnerId),
      getEventById(eventId),
      getOrgAdminsWithEmails(auth.orgId),
    ])

    const directUrl = `${BASE_URL}/events/${eventId}/partners/${partnerId}`

    for (const r of recipients) {
      sendEmail({
        to: r.email,
        subject: partnerReminderEmailSubject({ partnerName: partner?.name ?? 'Partner' }),
        html: partnerReminderEmailHtml({
          recipientName: r.name ?? r.email,
          partnerName: partner?.name ?? 'Unknown',
          eventName: event?.name ?? 'Unknown',
          items,
          directUrl,
          senderName: auth.userEmail,
        }),
      })
    }

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'updated',
      targetType: 'partner',
      targetId: partnerId,
      eventId,
      details: { reminder: 'partner_summary', count: items.length, actor_email: auth.userEmail },
    })

    return { ok: true, count: items.length }
  } catch (err) {
    console.error('sendPartnerReminderAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to send reminders' }
  }
}

export async function approveDeliverableAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can approve deliverables' }

    const deliverable = await getDeliverableById(deliverableId)
    if (!deliverable) return { ok: false, error: 'Deliverable not found' }
    if (deliverable.status !== 'pending_approval') return { ok: false, error: 'Deliverable is not pending approval' }

    // Verify this category actually requires approval
    const adminClient = tryCreateAdminClient()
    let orgSettings: OrgSettings | null = null
    if (adminClient) {
      const { data: orgRow } = await adminClient.from('organizations').select('settings').eq('id', auth.orgId).single()
      orgSettings = (orgRow?.settings ?? {}) as OrgSettings
    }
    if (!requiresApproval(deliverable.category, orgSettings)) {
      return { ok: false, error: 'This category does not require approval' }
    }

    await updateDeliverableStatus(deliverableId, 'proved')

    fireWebhook('deliverable_proved', auth.orgId, {
      deliverable_id: deliverableId,
      title: deliverable.title,
      category: deliverable.category,
      event_id: eventId,
      partner_id: partnerId,
    })

    // Clear any previous rejection note
    if (deliverable.rejection_note) {
      await clearRejectionNote(deliverableId)
    }

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'approved_deliverable',
      targetType: 'deliverable',
      targetId: deliverableId,
      eventId,
      details: { title: deliverable.title, partner_id: partnerId, actor_email: auth.userEmail },
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('approveDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to approve deliverable' }
  }
}

/** Backward-compatible alias */
export const approveTalentDeliverableAction = approveDeliverableAction

export async function rejectDeliverableAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
  rejectionNote: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }
    if (!rejectionNote.trim()) return { ok: false, error: 'Rejection note is required' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can reject deliverables' }

    const deliverable = await getDeliverableById(deliverableId)
    if (!deliverable) return { ok: false, error: 'Deliverable not found' }
    if (deliverable.status !== 'pending_approval') return { ok: false, error: 'Deliverable is not pending approval' }

    await rejectDeliverable(deliverableId, rejectionNote.trim())

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'rejected_deliverable',
      targetType: 'deliverable',
      targetId: deliverableId,
      eventId,
      details: {
        title: deliverable.title,
        partner_id: partnerId,
        rejection_note: rejectionNote.trim(),
        actor_email: auth.userEmail,
      },
    })

    // Notify the deliverable owner (or proof uploader as fallback)
    const notifyAdmin = tryCreateAdminClient()
    if (notifyAdmin) {
      let notifyUserId = deliverable.owner_id
      if (!notifyUserId) {
        const { data: recentProof } = await notifyAdmin
          .from('proofs')
          .select('uploaded_by')
          .eq('deliverable_id', deliverableId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        notifyUserId = recentProof?.uploaded_by ?? null
      }
      if (notifyUserId && notifyUserId !== auth.userId) {
        createNotification(notifyAdmin, {
          userId: notifyUserId,
          orgId: auth.orgId,
          type: 'deliverable_rejected',
          title: `"${deliverable.title}" was rejected`,
          body: rejectionNote.trim(),
          link: `/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`,
        }).catch(() => {})
      }
    }

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('rejectDeliverableAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to reject deliverable' }
  }
}

export async function extendUsageRightsAction(
  deliverableId: string,
  eventId: string,
  partnerId: string,
  duration: UsageDuration,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isUuid(deliverableId)) return { ok: false, error: 'Invalid deliverable ID' }
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!isUuid(partnerId)) return { ok: false, error: 'Invalid partner ID' }
    if (!USAGE_DURATIONS.includes(duration)) return { ok: false, error: 'Invalid duration' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canManageContent(auth.role)) return { ok: false, error: 'Only admins can extend usage rights' }

    const deliverable = await getDeliverableById(deliverableId)
    if (!deliverable) return { ok: false, error: 'Deliverable not found' }
    if (deliverable.category !== 'talent') return { ok: false, error: 'Only talent deliverables have usage rights' }

    let newExpirationDate: string | null = null

    if (duration === 'perpetual') {
      // Perpetual = no expiration
      newExpirationDate = null
    } else if (duration === 'custom') {
      return { ok: false, error: 'Custom duration is not supported for extensions' }
    } else {
      // Extend from current expiration date (renewal), or from today if no current expiration
      const baseDate = deliverable.usage_expiration_date ?? new Date().toISOString().split('T')[0]
      newExpirationDate = computeExpirationDate(baseDate, duration) ?? null
    }

    await updateDeliverable(deliverableId, {
      usage_duration: duration,
      usage_expiration_date: newExpirationDate ?? undefined,
    })

    // If perpetual, explicitly clear the expiration date
    if (duration === 'perpetual') {
      const supabase = await createClient()
      await supabase
        .from('deliverables')
        .update({ usage_expiration_date: null })
        .eq('id', deliverableId)
    }

    logActivity({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'updated',
      targetType: 'deliverable',
      targetId: deliverableId,
      eventId,
      details: {
        field: 'usage_rights_extended',
        new_duration: duration,
        new_expiration: newExpirationDate,
        partner_id: partnerId,
        actor_email: auth.userEmail,
      },
    })

    revalidatePath('/events')
    revalidatePath('/dashboard')
    revalidatePath(`/events/${eventId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}`)
    revalidatePath(`/events/${eventId}/partners/${partnerId}/deliverables/${deliverableId}`)

    return { ok: true }
  } catch (err) {
    console.error('extendUsageRightsAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to extend usage rights' }
  }
}

export async function markCategoryDoneAction(
  eventId: string,
  category: DeliverableCategory,
): Promise<{ ok: boolean; error?: string; count?: number }> {
  try {
    if (!isUuid(eventId)) return { ok: false, error: 'Invalid event ID' }
    if (!CATEGORIES.includes(category)) return { ok: false, error: 'Invalid category' }

    const auth = await getAuthenticatedOrg()
    if ('error' in auth) return { ok: false, error: auth.error }
    if (!canEditContent(auth.role)) return { ok: false, error: 'Permission denied' }

    const count = await bulkUpdateDeliverableStatus(eventId, category, 'done')

    if (count > 0) {
      logActivity({
        orgId: auth.orgId,
        userId: auth.userId,
        action: 'status_changed',
        targetType: 'deliverable',
        eventId,
        details: { bulk: true, category, to: 'done', count, actor_email: auth.userEmail },
      })

      revalidatePath('/events')
      revalidatePath('/dashboard')
      revalidatePath(`/events/${eventId}`)
    }

    return { ok: true, count }
  } catch (err) {
    console.error('markCategoryDoneAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update deliverables' }
  }
}
