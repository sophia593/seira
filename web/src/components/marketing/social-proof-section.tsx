const LOGOS = [
  'Venue Group',
  'Sports Org',
  'Festival Co',
  'Arena Mgmt',
  'College Athletics',
  'Esports League',
]

export function SocialProofSection() {
  return (
    <section className="bg-muted/30 py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-10">
          trusted by teams across live entertainment
        </p>

        {/* Placeholder logo bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {LOGOS.map((name) => (
            <div
              key={name}
              className="flex items-center justify-center h-12 rounded-xl border border-border bg-card opacity-40"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>

        {/* Testimonial placeholder */}
        <div className="max-w-2xl mx-auto">
          <blockquote className="border-l-2 border-copper pl-6">
            <p className="text-base sm:text-lg italic text-muted-foreground leading-relaxed">
              &ldquo;we used to track everything in spreadsheets and email threads.
              seira gave us one place to manage deliverables, collect proof, and
              send recaps — our partners noticed the difference immediately.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              — sponsorship director, major league venue
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
