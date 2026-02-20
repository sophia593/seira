import { ClipboardList, Camera, FileBarChart, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'track',
    headline: 'log every deliverable',
    description:
      'create deliverables by category — in-venue, digital, signage, hospitality — and assign due dates. see completion at a glance across events and seasons.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    number: '02',
    icon: Camera,
    title: 'prove',
    headline: 'collect proof of performance',
    description:
      'upload photos, videos, and documents directly to each deliverable. status auto-advances when proof is attached. nothing slips through.',
    color: 'text-copper',
    bgColor: 'bg-copper/10',
  },
  {
    number: '03',
    icon: FileBarChart,
    title: 'report',
    headline: 'send branded recaps',
    description:
      'generate polished recap reports with fulfillment stats, proof galleries, and category breakdowns. share via link or download as pdf.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
]

export function StepsSection() {
  return (
    <section className="bg-kurobeni py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest text-copper mb-2">
            how it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white lowercase">
            three steps to fulfillment clarity
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-0">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center px-6">
              {/* Connector arrow (between steps, desktop only) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex absolute right-0 top-10 translate-x-1/2 z-10 items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10">
                  <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                </div>
              )}

              {/* Step number */}
              <span className="text-[10px] uppercase tracking-widest text-white/30 mb-3">
                {step.number}
              </span>

              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${step.bgColor} ${step.color} mb-4`}>
                <step.icon className="w-7 h-7" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white lowercase mb-1">
                {step.title}
              </h3>

              {/* Headline */}
              <p className="text-sm font-medium text-white/70 lowercase mb-2">
                {step.headline}
              </p>

              {/* Description */}
              <p className="text-sm text-white/40 max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
