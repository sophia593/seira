import Link from 'next/link'
import { ArrowRight, Calendar, Plane, Hotel } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
          {/* Hero Text */}
          <div className="max-w-2xl mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
              Plan trips to live events,
              <br />
              <span className="text-muted-foreground">effortlessly.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Find a concert, game, or show — seira builds the travel around it.
              Flights, hotels, and tickets in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/signup">
                  Start Planning
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Find Events</h3>
              <p className="text-sm text-muted-foreground">
                Search concerts, sports, theater, and more from top ticket providers.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium mb-2">Book Flights</h3>
              <p className="text-sm text-muted-foreground">
                Compare flights timed perfectly around your event schedule.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <Hotel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-medium mb-2">Stay Close</h3>
              <p className="text-sm text-muted-foreground">
                Find hotels near the venue with prices for your exact dates.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
