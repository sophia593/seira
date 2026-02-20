import {
  ClipboardList,
  Camera,
  FileBarChart,
  LayoutTemplate,
  Shield,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'deliverable tracking',
    description:
      'organize obligations by category — in-venue, digital, signage, hospitality, talent, content. assign due dates, track status, and see overdue items at a glance.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Camera,
    title: 'proof uploads',
    description:
      'attach photos, videos, and documents directly to deliverables. status auto-advances to "proved" when proof is uploaded. lightbox preview and full-size gallery.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: FileBarChart,
    title: 'recap reports',
    description:
      'generate branded fulfillment reports with completion rings, category breakdowns, and proof galleries. share via public link or download as pdf.',
    color: 'text-copper',
    bgColor: 'bg-copper/10',
  },
  {
    icon: LayoutTemplate,
    title: 'templates',
    description:
      'save and reuse deliverable sets across events. apply a template to instantly populate a partner with the right obligations — no re-entry needed.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: Shield,
    title: 'team roles',
    description:
      'invite your team with granular permissions. owners and admins manage content, contributors update statuses and upload proof, viewers get read-only access.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Sparkles,
    title: 'ai-powered insights',
    description:
      'smart suggestions for deliverable templates, automated proof matching, and natural-language recap summaries. let ai handle the busywork.',
    badge: 'coming soon',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
]

export function FeatureGridSection() {
  return (
    <section className="bg-muted/30 py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-copper mb-2">
            features
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold lowercase">
            everything you need to close the loop
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
            from the first deliverable to the final recap — seira covers every step of sponsorship fulfillment.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={cn(
                'rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md',
                feature.badge && 'relative overflow-hidden',
              )}
            >
              {feature.badge && (
                <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-medium text-rose-500 uppercase tracking-wide">
                  {feature.badge}
                </span>
              )}
              <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4', feature.bgColor, feature.color)}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold lowercase mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
