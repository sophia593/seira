import { Trophy, Building2, Music } from 'lucide-react'

const AUDIENCES = [
  {
    icon: Trophy,
    title: 'sports teams',
    examples: 'MLB, NBA, NHL, MLS, college athletics',
    description:
      'manage season-long sponsor packages across 80+ home games. track in-venue signage, LED boards, PA reads, and suite access — then prove it all with photos and recaps.',
  },
  {
    icon: Building2,
    title: 'venues & arenas',
    examples: 'stadiums, convention centers, performing arts',
    description:
      'coordinate naming rights, concourse activations, and hospitality deliverables across multiple tenants and events. one platform for every partner relationship.',
  },
  {
    icon: Music,
    title: 'festivals & live events',
    examples: 'music festivals, food & wine, esports, expos',
    description:
      'fulfill sponsor commitments for multi-day events — stage branding, artist meet-and-greets, social media posts, and branded content. collect proof on-site in real time.',
  },
]

export function AudienceSection() {
  return (
    <section className="bg-background py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-copper mb-2">
            who it&apos;s for
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold lowercase">
            built for live entertainment
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
            seira is purpose-built for the teams who sell, deliver, and report on sponsorship commitments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {AUDIENCES.map((audience) => (
            <div
              key={audience.title}
              className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-copper/10 text-copper mb-4">
                <audience.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold lowercase mb-1">
                {audience.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {audience.examples}
              </p>
              <p className="text-sm text-muted-foreground">
                {audience.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
