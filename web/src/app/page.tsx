import Link from "next/link"
import { Calendar, MessageSquare, Sparkles, Plane } from "lucide-react"
import { Logo } from "@/components/logo"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Logo className="text-xl" linkToHome={false} />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-nav px-4 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            log in
          </Link>
          <Link
            href="/signup"
            className="text-nav px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors"
          >
            sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium mb-6 lowercase">
          <Sparkles className="h-4 w-4" />
          ai-powered trip planning
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-6 lowercase">
          plan trips around the
          <br />
          <span className="text-zinc-500 dark:text-zinc-400">events you love</span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
          Tell seira about a concert, game, or show you want to attend.
          Get personalized flight options and everything coordinated in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3 text-base font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors lowercase"
          >
            get started free
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3 text-base font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors lowercase"
          >
            log in
          </Link>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-8 mt-24 text-left">
          <div className="p-6 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <MessageSquare className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-card-title text-zinc-900 dark:text-white mb-2">
              just chat
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tell seira what event you want to attend. No complex forms or filters.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-card-title text-zinc-900 dark:text-white mb-2">
              real events
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Live data from Ticketmaster. Find concerts, sports, theater, and more.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Plane className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-card-title text-zinc-900 dark:text-white mb-2">
              flights included
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Get flight options matched to your event dates. One seamless trip.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-sm text-zinc-500">
        <p className="lowercase">built with claude ai</p>
      </footer>
    </div>
  )
}
