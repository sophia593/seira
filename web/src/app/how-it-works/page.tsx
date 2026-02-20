import Link from 'next/link'
import {
  Settings,
  ClipboardList,
  Camera,
  FileBarChart,
} from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'how it works',
  description:
    'From setup to recap in four steps. See how seira helps sponsorship teams track deliverables, collect proof, and send branded reports.',
  openGraph: {
    title: 'How It Works — Seira',
    description:
      'From setup to recap in four steps. See how seira helps sponsorship teams track deliverables, collect proof, and send branded reports.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

const STEPS = [
  {
    number: '01',
    icon: Settings,
    title: 'set up your event',
    description:
      'Create an event, add partners, and import deliverables from a template or build your obligation list from scratch. Set due dates, assign owners, and choose proof requirements for each item.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    placeholderGradient: 'from-purple-100 to-purple-50',
    placeholderLabel: 'Event setup & partner dashboard',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'track every deliverable',
    description:
      'Organize obligations by category — in-venue, digital, signage, hospitality, talent, content. See completion at a glance with progress bars and status indicators across all partners and events.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    placeholderGradient: 'from-blue-100 to-blue-50',
    placeholderLabel: 'Deliverable tracking by category',
  },
  {
    number: '03',
    icon: Camera,
    title: 'collect proof of performance',
    description:
      'Upload photos, videos, and documents directly to each deliverable. Status auto-advances to "proved" when proof is attached. Review proof in a full-size lightbox gallery — nothing slips through.',
    color: 'text-copper',
    bgColor: 'bg-copper/10',
    placeholderGradient: 'from-amber-100 to-orange-50',
    placeholderLabel: 'Proof upload & gallery view',
  },
  {
    number: '04',
    icon: FileBarChart,
    title: 'send branded recaps',
    description:
      'Generate polished recap reports with fulfillment rings, category breakdowns, proof galleries, and completion timelines. Share via public link or download as a PDF your partners will actually want to read.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    placeholderGradient: 'from-emerald-100 to-emerald-50',
    placeholderLabel: 'Branded recap report preview',
  },
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      <MarketingNav variant="dark" />

      {/* Hero */}
      <section className="bg-gradient-to-b from-kurobeni to-blackberry pt-32 pb-20 sm:pt-40 sm:pb-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs sm:text-sm uppercase tracking-widest text-copper animate-fade-in-up">
            how it works
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mt-4 lowercase leading-tight animate-fade-in-up animation-delay-100">
            from setup to recap in four steps
          </h1>
          <p className="text-base sm:text-lg text-white/60 mt-4 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            seira replaces scattered spreadsheets and email threads with a single
            platform for sponsorship fulfillment. here&apos;s how it works.
          </p>
        </div>
      </section>

      {/* Steps */}
      {STEPS.map((step, i) => (
        <section
          key={step.number}
          className={cn(
            'py-20 sm:py-28 px-6',
            i % 2 === 0 ? 'bg-background' : 'bg-muted/30',
          )}
        >
          <div className="max-w-5xl mx-auto">
            <div
              className={cn(
                'grid lg:grid-cols-2 gap-12 lg:gap-16 items-center',
                i % 2 !== 0 && 'lg:grid-flow-dense',
              )}
            >
              {/* Text */}
              <div className={cn(i % 2 !== 0 && 'lg:col-start-2')}>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  step {step.number}
                </span>
                <div
                  className={cn(
                    'inline-flex items-center justify-center w-12 h-12 rounded-2xl mt-3 mb-4',
                    step.bgColor,
                    step.color,
                  )}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold lowercase mb-4">
                  {step.title}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>

              {/* Screenshot placeholder */}
              <div className={cn(i % 2 !== 0 && 'lg:col-start-1')}>
                <div
                  className={cn(
                    'aspect-[16/10] rounded-2xl border border-border shadow-lg flex items-center justify-center bg-gradient-to-br',
                    step.placeholderGradient,
                  )}
                >
                  <p className="text-sm text-muted-foreground/60 font-medium lowercase">
                    {step.placeholderLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Bottom CTA */}
      <section className="bg-gradient-to-b from-kurobeni to-blackberry py-20 sm:py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white lowercase mb-4">
            ready to streamline your fulfillment?
          </h2>
          <p className="text-base text-white/60 mb-8">
            join sponsorship teams who use seira to track, prove, and report — all
            in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center h-11 px-6 rounded-xl bg-copper text-white text-sm font-semibold lowercase hover:bg-copper/90 transition-colors"
            >
              get started free
            </Link>
            <Link
              href="/sample"
              className="text-sm font-medium text-white/50 hover:text-white transition-colors lowercase"
            >
              or view a sample recap
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
