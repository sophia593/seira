import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Link,
} from '@react-pdf/renderer'
import type { RecapData } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COPPER = '#C59C79'
const DARK = '#281822'
const GRAY_100 = '#f3f4f6'
const GRAY_200 = '#e5e7eb'
const GRAY_400 = '#9ca3af'
const GRAY_500 = '#6b7280'
const GRAY_900 = '#111827'
const GREEN_BG = '#dcfce7'
const GREEN_TEXT = '#166534'
const YELLOW_BG = '#fef9c3'
const YELLOW_TEXT = '#854d0e'

const MAX_PROOF_IMAGES = 2

const CATEGORY_LABELS: Record<string, string> = {
  'in-venue': 'In-Venue',
  digital: 'Digital',
  hospitality: 'Hospitality',
  signage: 'Signage',
  talent: 'Talent',
  content: 'Content',
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
  proved: 'Proved',
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: GRAY_900,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
    paddingBottom: 12,
    marginBottom: 20,
  },
  orgName: { fontSize: 14, fontWeight: 'bold', color: DARK },
  headerLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: GRAY_400 },
  // Title
  eventName: { fontSize: 22, fontWeight: 'bold', color: DARK },
  partnerName: { fontSize: 14, color: GRAY_500, marginTop: 4 },
  eventDetails: { fontSize: 9, color: GRAY_400, marginTop: 6 },
  // Cover note
  coverNote: {
    borderLeftWidth: 3,
    borderLeftColor: COPPER,
    backgroundColor: '#faf5f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    borderRadius: 2,
  },
  coverNoteText: { fontSize: 9, color: GRAY_500, fontStyle: 'italic' },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: GRAY_100,
    borderRadius: 8,
    padding: 16,
    marginTop: 18,
    marginBottom: 18,
  },
  statBox: { flex: 1 },
  statLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, color: GRAY_400 },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 3, color: GRAY_900 },
  statValueCopper: { fontSize: 18, fontWeight: 'bold', marginTop: 3, color: COPPER },
  statSub: { fontSize: 8, color: GRAY_400, marginTop: 1 },
  // Progress bar
  progressOuter: { height: 4, backgroundColor: GRAY_200, borderRadius: 2, marginTop: 8 },
  progressInner: { height: 4, backgroundColor: COPPER, borderRadius: 2 },
  // Category
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: DARK },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: GRAY_200,
    borderRadius: 4,
    padding: 10,
    marginBottom: 4,
  },
  catName: { fontSize: 9, fontWeight: 'bold', marginBottom: 3 },
  catStat: { fontSize: 8, color: GRAY_500, marginBottom: 4 },
  catBarOuter: { height: 3, backgroundColor: GRAY_100, borderRadius: 2 },
  catBarInner: { height: 3, backgroundColor: COPPER, borderRadius: 2 },
  // Deliverable
  delCard: {
    borderWidth: 1,
    borderColor: GRAY_200,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  delHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  delTitle: { fontSize: 11, fontWeight: 'bold' },
  delMeta: { flexDirection: 'row', gap: 6, marginTop: 3 },
  badge: { fontSize: 7, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  completedBadge: { backgroundColor: GREEN_BG, color: GREEN_TEXT },
  pendingBadge: { backgroundColor: YELLOW_BG, color: YELLOW_TEXT },
  catBadge: { backgroundColor: GRAY_100, color: GRAY_500 },
  dueDateText: { fontSize: 8, color: GRAY_400 },
  // Proof
  proofGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  proofImage: { width: 140, height: 100, objectFit: 'cover', borderRadius: 4 },
  proofPlaceholder: {
    width: 140,
    height: 100,
    backgroundColor: GRAY_100,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofPlaceholderText: { fontSize: 8, color: GRAY_400, textAlign: 'center' },
  proofCaption: { fontSize: 7, color: GRAY_400, marginTop: 2, maxWidth: 140 },
  noProof: { fontSize: 9, color: GRAY_400, fontStyle: 'italic', marginTop: 6 },
  moreProof: { fontSize: 8, color: COPPER, marginTop: 4 },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
    paddingTop: 12,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: GRAY_400 },
  // Page number
  pageNumber: { position: 'absolute', bottom: 20, right: 40, fontSize: 8, color: GRAY_400 },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isImageMime(type: string): boolean {
  return type.startsWith('image/')
}

function isPdfMime(type: string): boolean {
  return type === 'application/pdf'
}

function isVideoMime(type: string): boolean {
  return type.startsWith('video/')
}

// ---------------------------------------------------------------------------
// PDF Document
// ---------------------------------------------------------------------------

interface RecapPDFProps {
  data: RecapData
  shareUrl?: string
}

export function RecapPDF({ data, shareUrl }: RecapPDFProps) {
  const { recap, organization, event, partner, deliverables, stats } = data
  const fulfillmentPct = stats.total > 0 ? Math.round((stats.proved / stats.total) * 100) : 0
  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <Document title={recap.title} author={organization.name}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.orgName}>{organization.name}</Text>
          <Text style={s.headerLabel}>Sponsorship Recap</Text>
        </View>

        {/* Title */}
        <Text style={s.eventName}>{event.name}</Text>
        <Text style={s.partnerName}>{partner.name}</Text>
        {(event.date || event.venue) && (
          <Text style={s.eventDetails}>
            {event.date && formatDate(event.date)}
            {event.date && event.venue ? ' · ' : ''}
            {event.venue ?? ''}
          </Text>
        )}

        {/* Cover note */}
        {recap.cover_note && (
          <View style={s.coverNote}>
            <Text style={s.coverNoteText}>{recap.cover_note}</Text>
          </View>
        )}

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Promised</Text>
            <Text style={s.statValue}>{stats.total}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Completed</Text>
            <Text style={s.statValue}>{stats.completed}</Text>
            {stats.total > 0 && <Text style={s.statSub}>{completionPct}%</Text>}
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Proof Collected</Text>
            <Text style={s.statValue}>{stats.proved}</Text>
            {stats.total > 0 && <Text style={s.statSub}>{fulfillmentPct}%</Text>}
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Fulfillment Rate</Text>
            <Text style={s.statValueCopper}>{fulfillmentPct}%</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressOuter}>
          <View style={[s.progressInner, { width: `${fulfillmentPct}%` }]} />
        </View>

        {/* Category breakdown */}
        {Object.keys(stats.byCategory).length > 0 && (
          <>
            <Text style={s.sectionTitle}>By Category</Text>
            <View style={s.catGrid}>
              {Object.entries(stats.byCategory).map(([cat, { total, completed }]) => {
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0
                return (
                  <View key={cat} style={s.catCard}>
                    <Text style={s.catName}>{CATEGORY_LABELS[cat] ?? cat}</Text>
                    <Text style={s.catStat}>{completed} of {total} completed</Text>
                    <View style={s.catBarOuter}>
                      <View style={[s.catBarInner, { width: `${pct}%` }]} />
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Page number */}
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>

      {/* Deliverables pages */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Deliverables &amp; Proof of Performance</Text>

        {deliverables.map((d) => {
          const isCompleted = d.status === 'done' || d.status === 'proved'
          const imageProofs = d.proofs.filter((p) => isImageMime(p.file_type))
          const nonImageProofs = d.proofs.filter((p) => !isImageMime(p.file_type))
          const shownImages = imageProofs.slice(0, MAX_PROOF_IMAGES)
          const extraCount = d.proofs.length - shownImages.length - nonImageProofs.length

          return (
            <View key={d.id} style={s.delCard} wrap={false}>
              <View style={s.delHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.delTitle}>{d.title}</Text>
                  <View style={s.delMeta}>
                    <Text style={[s.badge, s.catBadge]}>
                      {CATEGORY_LABELS[d.category] ?? d.category}
                    </Text>
                    {d.due_date && (
                      <Text style={s.dueDateText}>Due {formatDate(d.due_date)}</Text>
                    )}
                  </View>
                </View>
                <Text style={[s.badge, isCompleted ? s.completedBadge : s.pendingBadge]}>
                  {STATUS_LABELS[d.status] ?? d.status}
                </Text>
              </View>

              {d.proofs.length > 0 ? (
                <View style={s.proofGrid}>
                  {shownImages.map((proof) => (
                    <View key={proof.id}>
                      <Image style={s.proofImage} src={proof.file_url} />
                      <Text style={s.proofCaption}>{proof.file_name}</Text>
                    </View>
                  ))}
                  {nonImageProofs.map((proof) => (
                    <View key={proof.id}>
                      <View style={s.proofPlaceholder}>
                        <Text style={s.proofPlaceholderText}>
                          {isPdfMime(proof.file_type) ? '[PDF]' : isVideoMime(proof.file_type) ? '[Video]' : '[File]'}
                        </Text>
                        <Text style={[s.proofPlaceholderText, { marginTop: 2 }]}>
                          See online version
                        </Text>
                      </View>
                      <Text style={s.proofCaption}>{proof.file_name}</Text>
                    </View>
                  ))}
                  {extraCount > 0 && (
                    <Text style={s.moreProof}>+{extraCount} more — see online report</Text>
                  )}
                </View>
              ) : (
                <Text style={s.noProof}>No proof uploaded</Text>
              )}
            </View>
          )
        })}

        {/* Footer */}
        <View style={s.footer}>
          <View>
            <Text style={s.footerText}>Generated by Seira</Text>
            {recap.published_at && (
              <Text style={[s.footerText, { marginTop: 2 }]}>
                Published {formatDate(recap.published_at)}
              </Text>
            )}
          </View>
          {shareUrl && (
            <Link src={shareUrl} style={s.footerText}>
              View interactive report →
            </Link>
          )}
        </View>

        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
