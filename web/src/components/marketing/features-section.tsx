import { ClipboardCheck, Camera, FileBarChart } from 'lucide-react'

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: 'track every deliverable',
    description:
      'organize partner obligations by event, season, and category. never lose sight of what was promised.',
  },
  {
    icon: Camera,
    title: 'collect proof of performance',
    description:
      'upload photos, videos, and documents as proof. your partners see exactly what was delivered.',
  },
  {
    icon: FileBarChart,
    title: 'send polished recaps',
    description:
      'generate branded recap reports with one click. share via link or download as pdf.',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-background py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-copper mb-2">
            why seira
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold lowercase">
            sponsorship fulfillment, simplified
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-copper/10 text-copper mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium lowercase mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
