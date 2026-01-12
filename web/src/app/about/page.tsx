import { Logo } from "@/components/logo"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-4xl mx-auto w-full">
        <Logo className="text-lg sm:text-xl" />
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h1 className="text-2xl sm:text-4xl font-semibold mb-6 lowercase">about seira</h1>

        <div className="space-y-6 text-muted-foreground">
          <p>
            seira is an ai-powered trip planner built for live events. tell us about a concert,
            game, or show you want to attend, and we'll find the tickets, flights, and hotels —
            all in one conversation.
          </p>

          <p>
            no more juggling tabs between ticketmaster, google flights, and booking.com.
            just chat with seira and get a complete trip plan in minutes.
          </p>

          <h2 className="text-lg font-medium text-foreground pt-4 lowercase">how it works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>tell us the event you want to attend</li>
            <li>we search for tickets, flights, and hotels</li>
            <li>review your options and book</li>
          </ol>

          <h2 className="text-lg font-medium text-foreground pt-4 lowercase">contact</h2>
          <p>
            questions? reach out at{" "}
            <a href="mailto:hello@seira.app" className="text-primary hover:underline">
              hello@seira.app
            </a>
          </p>
        </div>

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
