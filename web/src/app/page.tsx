import Link from "next/link"
import { MessageSquare, Sparkles, Search, CheckCircle, Plane, MapPin, Ticket } from "lucide-react"
import { Logo } from "@/components/logo"
import { LandingHeader } from "@/components/landing-header"
import { LandingCTA } from "@/components/landing-cta"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col overflow-x-hidden">
      {/* Header */}
      <LandingHeader />

      {/* Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20">
        <div className="text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6 lowercase">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ai-powered trip planning
          </div>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6 lowercase leading-tight">
            plan trips to live events
            <br />
            <span className="text-muted-foreground">in minutes</span>
          </h1>

          <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
            Tell seira about a concert, game, or show you want to attend.
            We&apos;ll find flights, hotels, and tickets — all in one conversation.
          </p>

          <LandingCTA />
        </div>

        {/* Chat Preview */}
        <div className="mb-16 sm:mb-24">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium lowercase">seira</span>
                <div className="ml-auto flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                </div>
              </div>

              {/* Chat messages */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                    I want to see Taylor Swift in LA this summer
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm space-y-3">
                    <p>Found the Eras Tour at SoFi Stadium on Aug 7! Here&apos;s what I put together:</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Ticket className="h-3.5 w-3.5 text-primary" />
                        <span>Floor seats available from $450</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Plane className="h-3.5 w-3.5 text-primary" />
                        <span>Direct flights from $289 roundtrip</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>Hotels near venue from $180/night</span>
                      </div>
                    </div>

                    <p className="text-muted-foreground">Want me to show you the full trip breakdown?</p>
                  </div>
                </div>
              </div>

              {/* Input preview */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">Ask about any event...</span>
                  <div className="ml-auto w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="relative">
          <h2 className="text-center text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6 sm:mb-10">
            How it works
          </h2>

          {/* Connecting line - desktop only */}
          <div className="hidden sm:block absolute top-[7.5rem] left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Step 1 */}
            <div className="relative group">
              <div className="flex flex-col items-center p-4 sm:p-6 rounded-2xl bg-card border border-border transition-all sm:hover:border-primary/30 sm:hover:shadow-lg sm:hover:shadow-primary/5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-2 sm:mb-4 transition-transform sm:group-hover:scale-110">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground mb-1">01</span>
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-0.5 lowercase">
                  tell us the event
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Describe what you want to see
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="flex flex-col items-center p-4 sm:p-6 rounded-2xl bg-card border border-border transition-all sm:hover:border-primary/30 sm:hover:shadow-lg sm:hover:shadow-primary/5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-2 sm:mb-4 transition-transform sm:group-hover:scale-110">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground mb-1">02</span>
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-0.5 lowercase">
                  we find everything
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Tickets, flights, and hotels
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="flex flex-col items-center p-4 sm:p-6 rounded-2xl bg-card border border-border transition-all sm:hover:border-primary/30 sm:hover:shadow-lg sm:hover:shadow-primary/5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-2 sm:mb-4 transition-transform sm:group-hover:scale-110">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground mb-1">03</span>
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-0.5 lowercase">
                  book and go
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Review, book, and you're set
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-4 text-center sm:text-left sm:flex-row sm:justify-between">
            <Logo className="text-lg" linkToHome={false} />

            <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                terms
              </Link>
              <a href="mailto:hello@seira.app" className="hover:text-foreground transition-colors">
                contact
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            <p>© 2025 seira · built with claude ai</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
