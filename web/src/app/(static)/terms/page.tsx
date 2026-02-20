import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'terms of service',
  description: 'Terms and conditions for using Seira.',
  openGraph: {
    title: 'Terms of Service — Seira',
    description: 'Terms and conditions for using Seira.',
  },
  twitter: { card: 'summary_large_image' },
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
          last updated: february 2026
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
                Seira is a sponsorship fulfillment platform that helps rights holders track partner
                deliverables, collect proof of performance, and generate recap reports.
              </p>
              <p>
                <strong className="text-foreground">Important:</strong> Seira stores data you provide
                (events, partners, deliverables, proof files) in your organization&apos;s workspace.
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

          {/* Data Accuracy */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">data accuracy</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Seira displays information that you and your team enter. While we work to keep the
                platform reliable:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>The accuracy of event, partner, and deliverable data depends on what you enter</li>
                <li>Generated reports reflect the current state of your data at time of creation</li>
                <li>We are not responsible for errors in user-provided content</li>
              </ul>
            </div>
          </section>

          {/* Billing & Payments */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">billing & payments</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Payments for Seira are processed by Stripe. By subscribing, you also agree
                to{' '}
                <a
                  href="https://stripe.com/legal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Stripe&apos;s terms of service
                </a>
                .
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>New accounts start with a 14-day free trial. Your payment method is collected at signup but not charged until the trial ends.</li>
                <li>Subscriptions auto-renew at the end of each billing period (monthly or annual) until you cancel.</li>
                <li>You may cancel at any time from your account settings. Access continues until the end of the current billing period.</li>
                <li>We do not offer refunds for partial billing periods.</li>
                <li>If we change our pricing, we will give at least 30 days&apos; notice before the new price takes effect.</li>
              </ul>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">third-party services</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Seira relies on third-party infrastructure to operate, including Supabase for data
                storage and authentication, Vercel for hosting, Stripe for payment processing,
                and cloud storage for proof files. These services have their own terms and privacy
                policies.
              </p>
              <p>
                We&apos;re not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Outages or issues with third-party infrastructure providers</li>
                <li>Data loss caused by external service failures beyond our control</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">intellectual property</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Seira&apos;s design, code, and branding are owned by us. Your event data, partner
                information, deliverables, and uploaded proof files belong to you.
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
                <li>We&apos;re not liable for inaccuracies in data you or your team enter</li>
                <li>We&apos;re not liable for decisions you make based on reports generated by the platform</li>
                <li>We&apos;re not liable for losses from service interruptions or data unavailability</li>
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
              <a href="mailto:support@seira.global" className="text-primary hover:underline">
                support@seira.global
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
