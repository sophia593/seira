import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo className="text-lg" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-semibold mb-6 lowercase">privacy policy</h1>

        <div className="prose prose-sm text-muted-foreground space-y-4">
          <p>
            This privacy policy is a placeholder. We're working on the full version.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-3">what we collect</h2>
          <p>
            We collect your email address and travel preferences to provide personalized trip recommendations.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-3">how we use it</h2>
          <p>
            Your data is used solely to improve your experience with Seira. We don't sell your information.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-3">questions?</h2>
          <p>
            Contact us at <a href="mailto:hello@seira.app" className="text-primary hover:underline">hello@seira.app</a>
          </p>
        </div>
      </main>
    </div>
  )
}
