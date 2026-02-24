'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  ChevronDown,
  HardDrive,
  Paintbrush,
  Code2,
  Headphones,
} from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  'unlimited events',
  'unlimited partners',
  'unlimited deliverables',
  'proof uploads (10 GB storage)',
  'recap reports with PDF export',
  'team roles & permissions',
  'email notifications',
  'priority support',
]

const ADDONS = [
  {
    icon: HardDrive,
    title: 'extra storage',
    price: '$20/mo',
    description: 'Additional 10 GB of proof storage beyond the included allowance.',
  },
  {
    icon: Paintbrush,
    title: 'white-label recaps',
    price: '$50/mo',
    description: 'Remove seira branding from recap reports and PDF exports.',
  },
  {
    icon: Code2,
    title: 'API access',
    price: '$75/mo',
    description: 'Programmatic access to deliverables, proofs, and recaps.',
  },
  {
    icon: Headphones,
    title: 'dedicated support',
    price: '$100/mo',
    description: 'Shared Slack channel and a dedicated account manager.',
  },
]

const FAQ = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — every new account starts with a 14-day free trial. Your card is collected at signup but you won\'t be charged until the trial ends.',
  },
  {
    q: 'How does billing work?',
    a: 'You choose monthly or annual billing when you subscribe. Monthly plans are billed at the start of each period. Annual plans are billed as a single payment upfront.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. You can switch between monthly and annual billing at any time from your account settings. Changes take effect at the next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, American Express) and ACH bank transfers for annual plans.',
  },
  {
    q: 'Is there a per-seat fee?',
    a: 'No. Seira pricing is per-organization, not per-user. Invite your whole team — owners, admins, contributors, and viewers — at no extra cost.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'You can cancel at any time. Your data stays accessible in read-only mode until the end of your billing period. After that, you can export everything or reactivate your plan.',
  },
  {
    q: 'Do you offer discounts for nonprofits?',
    a: 'Yes. We offer a 30% discount for registered nonprofit organizations. Contact us at support@seira.global to apply.',
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main className="min-h-screen bg-background">
      <MarketingNav variant="light" />

      {/* Hero */}
      <section className="pt-12 pb-4 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-copper mb-2">
            pricing
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold lowercase">
            simple pricing for every team
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-lg mx-auto">
            one plan, no per-seat fees. everything you need to track deliverables,
            collect proof, and send branded recaps.
          </p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="py-12 sm:py-16 px-6">
        <div className="max-w-md mx-auto">
          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={cn(
                'text-sm font-medium px-4 py-1.5 rounded-lg transition-colors',
                !annual
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={cn(
                'text-sm font-medium px-4 py-1.5 rounded-lg transition-colors',
                annual
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              annual
              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase">
                save $380
              </span>
            </button>
          </div>

          {/* Card */}
          <div className="rounded-2xl border-2 border-copper/30 bg-card p-8 shadow-lg">
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                seira pro
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">
                  {annual ? '$1,900' : '$190'}
                </span>
                <span className="text-muted-foreground text-lg">
                  /{annual ? 'yr' : 'mo'}
                </span>
              </div>
              {annual && (
                <p className="text-sm text-emerald-600 mt-1">
                  $158/mo — save $380 vs monthly
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm"
                >
                  <Check className="w-4 h-4 text-copper shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="flex items-center justify-center h-11 w-full rounded-xl bg-copper text-white text-sm font-semibold lowercase hover:bg-copper/90 transition-colors"
            >
              start free trial
            </Link>
            <p className="text-xs text-muted-foreground text-center mt-3">
              14-day free trial · cancel anytime
            </p>
            <a
              href="/api/one-pager/pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-copper text-center mt-2 hover:underline lowercase"
            >
              download one-pager (pdf)
            </a>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-muted/30 py-16 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-copper mb-2">
              add-ons
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold lowercase">
              customize your plan
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {ADDONS.map((addon) => (
              <div
                key={addon.title}
                className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-copper/10 text-copper">
                    <addon.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-copper">
                    {addon.price}
                  </span>
                </div>
                <h3 className="text-base font-semibold lowercase mb-1">
                  {addon.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {addon.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-copper mb-2">
              faq
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold lowercase">
              common questions
            </h2>
          </div>

          <div className="divide-y divide-border">
            {FAQ.map((item, i) => (
              <div key={item.q} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full text-left gap-4"
                >
                  <span className="text-sm font-medium">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 shrink-0 text-muted-foreground transition-transform',
                      openFaq === i && 'rotate-180',
                    )}
                  />
                </button>
                {openFaq === i && (
                  <p className="text-sm text-muted-foreground mt-3 pr-8">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-b from-kurobeni to-blackberry py-20 sm:py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white lowercase mb-4">
            ready to get started?
          </h2>
          <p className="text-base text-white/60 mb-8">
            start your 14-day free trial today. cancel anytime before your trial ends.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center h-11 px-6 rounded-xl bg-copper text-white text-sm font-semibold lowercase hover:bg-copper/90 transition-colors"
          >
            start free trial
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
