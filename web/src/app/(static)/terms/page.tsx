import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'terms of service | seira',
  description: 'Terms and conditions for using Seira.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2 lowercase">
          terms of service
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          last updated: january 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">

          {/* Intro */}
          <section>
            <p className="text-muted-foreground">
              Welcome to Seira. By using our service, you agree to these terms. Please read them carefully.
            </p>
          </section>

          {/* What Seira Is */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">what seira is</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Seira is an AI assistant that helps you discover live events and plan trips to attend them.
                We search for events, suggest flights, research hotels, and help you organize your travel plans.
              </p>
              <p>
                <strong className="text-foreground">Important:</strong> Seira does not book or purchase anything on your behalf.
                We provide information and links to third-party services (Ticketmaster, airlines, hotels) where you
                complete your own bookings.
              </p>
            </div>
          </section>

          {/* Your Account */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">your account</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>To use Seira, you need to create an account. You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Provide accurate information</li>
                <li>Keep your login credentials secure</li>
                <li>Not share your account with others</li>
                <li>Notify us if you suspect unauthorized access</li>
              </ul>
              <p className="mt-3">
                You must be at least 13 years old to use Seira.
              </p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">acceptable use</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Use Seira for any illegal purpose</li>
                <li>Attempt to access other users' data</li>
                <li>Overload our systems with automated requests</li>
                <li>Reverse engineer or copy our service</li>
                <li>Use Seira to spam or harass others</li>
              </ul>
            </div>
          </section>

          {/* Information Accuracy */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">information accuracy</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Seira provides information from third-party sources like Ticketmaster and web searches.
                While we try to be accurate:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Event details, prices, and availability can change at any time</li>
                <li>Flight prices are estimates and may differ when you book</li>
                <li>Hotel information is for reference—always verify before booking</li>
                <li>AI-generated responses may occasionally contain errors</li>
              </ul>
              <p className="mt-3">
                <strong className="text-foreground">Always verify important details</strong> directly with the
                event venue, airline, or hotel before making purchases.
              </p>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">third-party services</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                When you click links to book tickets, flights, or hotels, you're leaving Seira and
                using third-party services. Those services have their own terms and privacy policies.
              </p>
              <p>
                We're not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Transactions you make on other websites</li>
                <li>Content or accuracy of third-party sites</li>
                <li>Issues with bookings made elsewhere</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">intellectual property</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Seira's design, code, and branding are owned by us. Your conversations and trip plans
                belong to you.
              </p>
              <p>
                You grant us permission to use your data to provide and improve the service, as
                described in our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  privacy policy
                </Link>.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">limitation of liability</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Seira is provided "as is" without warranties. To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>We're not liable for missed events, flights, or travel issues</li>
                <li>We're not liable for decisions you make based on our information</li>
                <li>We're not liable for losses from service interruptions</li>
                <li>Our total liability is limited to what you paid us (if anything)</li>
              </ul>
            </div>
          </section>

          {/* Service Changes */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">service changes</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                We may modify, suspend, or discontinue Seira at any time. We'll try to give notice
                for significant changes, but can't guarantee it.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">termination</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                You can close your account at any time. We may suspend or terminate accounts that
                violate these terms or for any other reason with notice.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">changes to these terms</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                We may update these terms. If we make significant changes, we'll notify you through
                the app or by email. Continued use after changes means you accept the new terms.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">contact us</h2>
            <p className="text-muted-foreground">
              Questions about these terms? Email us at{' '}
              <a href="mailto:hello@seira.app" className="text-primary hover:underline">
                hello@seira.app
              </a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            privacy policy
          </Link>
          <span className="mx-2">•</span>
          <Link href="/" className="hover:text-foreground transition-colors">
            back to seira
          </Link>
        </div>
      </main>
    </div>
  )
}
