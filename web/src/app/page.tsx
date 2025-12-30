import Link from "next/link"
import { Plane, Calendar, MessageSquare, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-semibold">Seira</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Trip Planning
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
          Plan trips around the
          <br />
          <span className="text-blue-600">events you love</span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
          Tell Seira about a concert, game, or show you want to attend.
          Get personalized flight options and everything coordinated in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3 text-base font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3 text-base font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Log in
          </Link>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-8 mt-24 text-left">
          <div className="p-6 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              Just chat
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tell Seira what event you want to attend. No complex forms or filters.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              Real events
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Live data from Ticketmaster. Find concerts, sports, theater, and more.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              Flights included
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Get flight options matched to your event dates. One seamless trip.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-sm text-zinc-500">
        <p>Built with Claude AI</p>
      </footer>
    </div>
  )
}
