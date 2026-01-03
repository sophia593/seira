import Link from "next/link"
import { MessageSquare, Sparkles, Search, CheckCircle, ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-6xl mx-auto w-full">
        <Logo className="text-lg sm:text-xl" linkToHome={false} />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="text-nav px-3 sm:px-4 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
          >
            log in
          </Link>
          <Link
            href="/signup"
            className="text-nav px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20">
        <div className="text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6 lowercase">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ai-powered trip planning
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6 lowercase leading-tight">
            plan trips to live events
            <br />
            <span className="text-muted-foreground">in minutes</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Tell seira about a concert, game, or festival you want to attend.
            We&apos;ll find flights, hotels, and tickets — all in one conversation.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:gap-3 lowercase group"
          >
            get started free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* How it works */}
        <div className="relative">
          <h2 className="text-center text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6 sm:mb-10">
            How it works
          </h2>

          {/* Connecting line - desktop only */}
          <div className="hidden sm:block absolute top-[7.5rem] left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4">
            {/* Step 1 */}
            <div className="relative group">
              <div className="flex flex-col items-center p-5 sm:p-6 rounded-2xl bg-card border border-border transition-all sm:hover:border-primary/30 sm:hover:shadow-lg sm:hover:shadow-primary/5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-3 sm:mb-4 transition-transform sm:group-hover:scale-110">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground mb-1 sm:mb-2">01</span>
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-1 lowercase">
                  tell us the event
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Describe what you want to see
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="flex flex-col items-center p-5 sm:p-6 rounded-2xl bg-card border border-border transition-all sm:hover:border-primary/30 sm:hover:shadow-lg sm:hover:shadow-primary/5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-3 sm:mb-4 transition-transform sm:group-hover:scale-110">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground mb-1 sm:mb-2">02</span>
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-1 lowercase">
                  we find options
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Tickets, flights, and hotels
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="flex flex-col items-center p-5 sm:p-6 rounded-2xl bg-card border border-border transition-all sm:hover:border-primary/30 sm:hover:shadow-lg sm:hover:shadow-primary/5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-3 sm:mb-4 transition-transform sm:group-hover:scale-110">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground mb-1 sm:mb-2">03</span>
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-1 lowercase">
                  book your trip
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Review and book when ready
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8 sm:mb-10">
            {/* Brand */}
            <div className="sm:col-span-1">
              <Logo className="text-lg mb-2 sm:mb-3" linkToHome={false} />
              <p className="text-sm text-muted-foreground">
                AI-powered trip planning for live events.
              </p>
            </div>

            {/* Links - row on mobile, columns on desktop */}
            <div className="grid grid-cols-3 sm:contents gap-4">
              {/* Product */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3 lowercase">product</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>
                    <Link href="/signup" className="hover:text-foreground transition-colors">
                      get started
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-foreground transition-colors">
                      log in
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3 lowercase">resources</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>
                    <span className="text-muted-foreground/50 cursor-default">help center</span>
                  </li>
                  <li>
                    <span className="text-muted-foreground/50 cursor-default">contact</span>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3 lowercase">legal</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>
                    <span className="text-muted-foreground/50 cursor-default">privacy</span>
                  </li>
                  <li>
                    <span className="text-muted-foreground/50 cursor-default">terms</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-4 sm:pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground lowercase">
              © 2025 seira. all rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground lowercase">
              built with claude ai
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
