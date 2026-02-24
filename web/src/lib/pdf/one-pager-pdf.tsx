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
const WHITE = '#ffffff'

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const TAGLINE = 'Commercial ops for live entertainment'

const DESCRIPTION =
  'Seira is the fulfillment platform for sponsorship teams. Track every deliverable, collect proof of performance, and send branded recap reports — all in one place.'

const AUDIENCES = [
  'Sports teams (MLB, NBA, NHL, MLS, college athletics)',
  'Venues & arenas (stadiums, convention centers, performing arts)',
  'Festivals & live events (music festivals, food & wine, esports, expos)',
]

const CATEGORIES = [
  { name: 'In-Venue', desc: 'Signage, LED boards, PA reads, suite access' },
  { name: 'Digital', desc: 'Social posts, email blasts, website placements' },
  { name: 'Signage', desc: 'Banners, wraps, scoreboard, concourse displays' },
  { name: 'Hospitality', desc: 'Suite tickets, VIP access, catering, gifting' },
  { name: 'Talent', desc: 'Appearances, meet-and-greets, usage rights' },
  { name: 'Content', desc: 'Photo, video, branded content, live streams' },
]

const KEY_FEATURES = [
  'Unlimited events, partners & deliverables',
  'Proof uploads with 10 GB storage',
  'Recap reports with PDF export',
  'Reusable deliverable templates',
  'Team roles & permissions',
  'Email notifications & reminders',
]

const PRICING = {
  plan: 'Seira Pro',
  monthly: '$190/mo',
  annual: '$1,900/yr',
  annualNote: 'Save $380 with annual billing',
  trial: '14-day free trial, no per-seat fees',
}

const ADDONS = [
  'Extra storage — $20/mo',
  'White-label recaps — $50/mo',
  'API access — $75/mo',
  'Dedicated support — $100/mo',
]

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

  // Header banner
  headerBanner: {
    backgroundColor: DARK,
    marginHorizontal: -40,
    marginTop: -40,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COPPER,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 9,
    color: WHITE,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  heroDescription: {
    fontSize: 11,
    color: WHITE,
    opacity: 0.85,
    marginTop: 12,
    lineHeight: 1.5,
    maxWidth: 380,
  },

  // Section headers
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: GRAY_200,
    marginBottom: 12,
  },

  // Who it's for
  audienceRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  audienceBullet: {
    fontSize: 9,
    color: COPPER,
    marginRight: 6,
    fontWeight: 'bold',
  },
  audienceText: {
    fontSize: 9,
    color: GRAY_500,
  },

  // Category grid
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catCard: {
    width: '31%',
    backgroundColor: GRAY_100,
    borderRadius: 6,
    padding: 10,
  },
  catName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 2,
  },
  catDesc: {
    fontSize: 8,
    color: GRAY_500,
    lineHeight: 1.4,
  },

  // Key features
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkmark: {
    fontSize: 9,
    color: COPPER,
    marginRight: 6,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 9,
    color: GRAY_900,
  },

  // Pricing row
  pricingRow: {
    flexDirection: 'row',
    backgroundColor: GRAY_100,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  pricingMain: {
    flex: 1,
  },
  pricingPlan: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: GRAY_400,
  },
  pricingAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK,
    marginTop: 2,
  },
  pricingOr: {
    fontSize: 9,
    color: GRAY_500,
    marginTop: 2,
  },
  pricingNote: {
    fontSize: 8,
    color: COPPER,
    marginTop: 2,
  },
  pricingTrial: {
    fontSize: 8,
    color: GRAY_400,
    marginTop: 4,
  },
  addonsBox: {
    flex: 1,
  },
  addonLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: GRAY_400,
    marginBottom: 4,
  },
  addonItem: {
    fontSize: 8,
    color: GRAY_500,
    marginBottom: 3,
  },

  // Screenshot
  screenshotImage: {
    width: '100%',
    height: 120,
    objectFit: 'contain',
    borderRadius: 8,
    marginBottom: 16,
  },
  screenshotPlaceholder: {
    height: 120,
    backgroundColor: GRAY_100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenshotLabel: {
    fontSize: 9,
    color: GRAY_400,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
    paddingTop: 10,
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 8,
    color: GRAY_400,
  },
  footerLink: {
    fontSize: 8,
    color: COPPER,
    textDecoration: 'none',
    marginTop: 2,
  },
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OnePagerPDFProps {
  screenshotUrl?: string
}

export function OnePagerPDF({ screenshotUrl }: OnePagerPDFProps) {
  return (
    <Document title="Seira — One-Pager" author="Seira">
      <Page size="A4" style={s.page}>

        {/* Header banner */}
        <View style={s.headerBanner}>
          <Text style={s.logoText}>seira</Text>
          <Text style={s.tagline}>{TAGLINE}</Text>
          <Text style={s.heroDescription}>{DESCRIPTION}</Text>
        </View>

        {/* Who it's for */}
        <Text style={s.sectionTitle}>Who It&#39;s For</Text>
        <View style={s.divider} />
        {AUDIENCES.map((a) => (
          <View key={a} style={s.audienceRow}>
            <Text style={s.audienceBullet}>›</Text>
            <Text style={s.audienceText}>{a}</Text>
          </View>
        ))}

        <View style={{ marginBottom: 14 }} />

        {/* What you can track */}
        <Text style={s.sectionTitle}>What You Can Track</Text>
        <View style={s.divider} />
        <View style={s.catGrid}>
          {CATEGORIES.map((cat) => (
            <View key={cat.name} style={s.catCard}>
              <Text style={s.catName}>{cat.name}</Text>
              <Text style={s.catDesc}>{cat.desc}</Text>
            </View>
          ))}
        </View>

        {/* Key features */}
        <Text style={s.sectionTitle}>Key Features</Text>
        <View style={s.divider} />
        {KEY_FEATURES.map((f) => (
          <View key={f} style={s.featureRow}>
            <Text style={s.checkmark}>✓</Text>
            <Text style={s.featureText}>{f}</Text>
          </View>
        ))}

        <View style={{ marginBottom: 14 }} />

        {/* Pricing */}
        <Text style={s.sectionTitle}>Pricing</Text>
        <View style={s.divider} />
        <View style={s.pricingRow}>
          <View style={s.pricingMain}>
            <Text style={s.pricingPlan}>{PRICING.plan}</Text>
            <Text style={s.pricingAmount}>{PRICING.monthly}</Text>
            <Text style={s.pricingOr}>or {PRICING.annual}</Text>
            <Text style={s.pricingNote}>{PRICING.annualNote}</Text>
            <Text style={s.pricingTrial}>{PRICING.trial}</Text>
          </View>
          <View style={s.addonsBox}>
            <Text style={s.addonLabel}>Optional Add-Ons</Text>
            {ADDONS.map((a) => (
              <Text key={a} style={s.addonItem}>{a}</Text>
            ))}
          </View>
        </View>

        {/* Recap screenshot */}
        {screenshotUrl ? (
          <Image style={s.screenshotImage} src={screenshotUrl} />
        ) : (
          <View style={s.screenshotPlaceholder}>
            <Text style={s.screenshotLabel}>Recap report preview</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <View>
            <Text style={s.footerText}>support@seira.global</Text>
            <Link src="https://seira.global" style={s.footerLink}>
              seira.global
            </Link>
          </View>
          <Text style={s.footerText}>Generated by Seira</Text>
        </View>

      </Page>
    </Document>
  )
}
