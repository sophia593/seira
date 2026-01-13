import { Logo } from "@/components/logo"
import { Check, ChevronDown } from "lucide-react"
import Link from "next/link"

// =============================================================================
// FAQ Data
// =============================================================================

const faqs = [
  {
    question: "is seira really free?",
    answer: "yes! seira is completely free to use. you can search for events, get flight and hotel recommendations, and save up to 10 trips without paying anything.",
  },
  {
    question: "how does seira make money?",
    answer: "when you book through our partner links (ticketmaster, airlines, hotels), we may receive a small commission. this doesn't affect the prices you see.",
  },
  {
    question: "what happens when pro launches?",
    answer: "free users keep everything they have. pro just adds extra features like unlimited saved trips, price alerts, and priority support.",
  },
  {
    question: "does seira book things for me?",
    answer: "no — seira finds and recommends options, but you complete all bookings directly with ticketmaster, airlines, and hotels. we never handle your payment info.",
  },
  {
    question: "can i cancel my account anytime?",
    answer: "yes, you can delete your account at any time from settings. all your data will be permanently removed.",
  },
]

// =============================================================================
// FAQ Item Component
// =============================================================================

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-border last:border-0">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
        <span className="text-sm font-medium lowercase">{question}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-sm text-muted-foreground">
        {answer}
      </div>
    </details>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-4xl mx-auto w-full">
        <Link href="/">
          <Logo className="text-lg sm:text-xl" />
        </Link>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          log in
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl font-semibold mb-2 lowercase">pricing</h1>
          <p className="text-muted-foreground">simple plans for every traveler</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-16">
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
              href="/login"
              className="inline-flex items-center justify-center w-full px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors lowercase"
            >
              get started
            </Link>
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 relative">
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

            <Link
              href="/contact?subject=early-access"
              className="inline-flex items-center justify-center w-full px-6 py-2.5 text-sm font-medium bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors lowercase"
            >
              request early access
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6 lowercase text-center">
            frequently asked questions
          </h2>
          <div className="rounded-2xl border bg-card p-6">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>

        {/* Contact */}
        <p className="text-center text-sm text-muted-foreground">
          have more questions? email us at{" "}
          <a
            href="mailto:support@seira.global"
            className="text-primary hover:underline"
          >
            support@seira.global
          </a>
        </p>

        {/* Back link */}
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
