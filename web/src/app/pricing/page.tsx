import { Logo } from "@/components/logo"
import { Check } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-4xl mx-auto w-full">
        <Logo className="text-lg sm:text-xl" />
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl font-semibold mb-2 lowercase">pricing</h1>
          <p className="text-muted-foreground">simple plans for every traveler</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Free tier */}
          <div className="rounded-2xl border border-primary bg-card p-6 sm:p-8 relative">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full lowercase">
              current
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1 lowercase">free</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>unlimited event searches</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>flight and hotel recommendations</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>ai trip planning</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>save up to 10 trips</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center w-full px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors lowercase"
            >
              get started
            </Link>
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 relative opacity-75">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full lowercase">
              coming soon
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1 lowercase">pro</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold">$9</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span>everything in free</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span>unlimited saved trips</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span>price alerts and tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span>priority support</span>
              </li>
            </ul>

            <button
              disabled
              className="inline-flex items-center justify-center w-full px-6 py-2.5 text-sm font-medium bg-muted text-muted-foreground rounded-lg cursor-not-allowed lowercase"
            >
              coming soon
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          questions? email us at{" "}
          <a href="mailto:hello@seira.app" className="text-primary hover:underline">
            hello@seira.app
          </a>
        </p>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
