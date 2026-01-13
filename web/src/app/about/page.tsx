import { Metadata } from "next"
import { Logo } from "@/components/logo"
import {
  Zap,
  Layers,
  Clock,
  Shield,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

// =============================================================================
// Metadata
// =============================================================================

export const metadata: Metadata = {
  title: "about | seira",
  description: "Seira is an AI-powered trip planner built for live events. Plan your next concert, game, or show in minutes.",
}

// =============================================================================
// Why Seira Data
// =============================================================================

const whySeira = [
  {
    icon: Zap,
    title: "ai-powered",
    description: "chat naturally about your plans — seira understands context and remembers your preferences.",
  },
  {
    icon: Layers,
    title: "all-in-one",
    description: "tickets, flights, and hotels in a single conversation. no more juggling tabs.",
  },
  {
    icon: Clock,
    title: "minutes, not hours",
    description: "get a complete trip plan in the time it takes to send a few messages.",
  },
  {
    icon: Shield,
    title: "you stay in control",
    description: "we recommend options — you book directly with ticketmaster, airlines, and hotels.",
  },
]

// =============================================================================
// How It Works Data
// =============================================================================

const howItWorks = [
  {
    step: "01",
    title: "tell us the event",
    description: "share the concert, game, or show you want to attend.",
  },
  {
    step: "02",
    title: "we find everything",
    description: "seira searches for tickets, flights, and hotels that match your preferences.",
  },
  {
    step: "03",
    title: "review and book",
    description: "compare your options and book directly with our partners.",
  },
]

// =============================================================================
// Main Page
// =============================================================================

export default function AboutPage() {
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-2xl sm:text-4xl font-semibold mb-4 lowercase">
            about seira
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            seira is an ai-powered trip planner built for live events. tell us about a concert,
            game, or show you want to attend, and we'll find the tickets, flights, and hotels —
            all in one conversation.
          </p>
        </div>

        {/* Why Seira */}
        <div className="mb-14">
          <h2 className="text-lg font-semibold mb-6 lowercase">why seira</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {whySeira.map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-2xl bg-card border"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium mb-1 lowercase">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-14">
          <h2 className="text-lg font-semibold mb-6 lowercase">how it works</h2>
          <div className="space-y-4">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="flex gap-4 p-5 rounded-2xl bg-card border"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium mb-1 lowercase">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 sm:p-8 text-center mb-14">
          <h2 className="text-lg font-semibold mb-2 lowercase">
            ready to plan your next trip?
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            start chatting with seira — it's free.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors lowercase"
          >
            get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Contact */}
        <div className="text-center text-sm text-muted-foreground mb-8">
          <p>
            questions? reach out at{" "}
            <a
              href="mailto:support@seira.global"
              className="text-primary hover:underline"
            >
              support@seira.global
            </a>
          </p>
        </div>

        {/* Legal */}
        <div className="text-center text-xs text-muted-foreground mb-8">
          <p>Seira LLC</p>
        </div>

        {/* Back link */}
        <div className="pt-8 border-t border-border">
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
