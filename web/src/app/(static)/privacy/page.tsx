import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'privacy policy | seira',
  description: 'How Seira collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
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
          privacy policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          last updated: january 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">

          {/* Intro */}
          <section>
            <p className="text-muted-foreground">
              Seira ("we", "our", or "us") is a travel assistant that helps you plan trips to live events.
              This policy explains how we collect, use, and protect your information when you use our service.
            </p>
          </section>

          {/* What We Collect */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">what we collect</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong className="text-foreground">Account information:</strong> Email address and name when you create an account.</p>
              <p><strong className="text-foreground">Travel preferences:</strong> Home airport, cabin class, seat preference, and budget settings you choose to provide.</p>
              <p><strong className="text-foreground">Conversations:</strong> Your chat history with Seira, including event searches, flight preferences, and saved trips.</p>
              <p><strong className="text-foreground">Usage data:</strong> How you interact with our service to help us improve it.</p>
            </div>
          </section>

          {/* How We Use It */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">how we use your information</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong className="text-foreground">To provide the service:</strong> Search for events, find flights, and save your trip plans.</p>
              <p><strong className="text-foreground">To personalize:</strong> Remember your preferences so you don't have to repeat yourself.</p>
              <p><strong className="text-foreground">To improve:</strong> Understand how people use Seira so we can make it better.</p>
              <p><strong className="text-foreground">To communicate:</strong> Send you information about your trips or important service updates.</p>
            </div>
          </section>

          {/* Third Parties */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">third-party services</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>To provide our service, we work with:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-foreground">Ticketmaster</strong> — for event information and ticket availability</li>
                <li><strong className="text-foreground">Anthropic (Claude)</strong> — for AI-powered conversations</li>
                <li><strong className="text-foreground">Google (Gemini)</strong> — for web research on venues and hotels</li>
                <li><strong className="text-foreground">Supabase</strong> — for secure data storage and authentication</li>
              </ul>
              <p className="mt-3">
                These services have their own privacy policies. We only share the minimum information
                needed to provide our service.
              </p>
            </div>
          </section>

          {/* Data Storage */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">data storage & security</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Your data is stored securely using industry-standard encryption. We use Supabase for our database, which provides:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Encryption at rest and in transit</li>
                <li>Row-level security (you can only access your own data)</li>
                <li>Regular security updates</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">your rights</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>You can:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-foreground">Access</strong> your data through your account settings</li>
                <li><strong className="text-foreground">Update</strong> your preferences at any time</li>
                <li><strong className="text-foreground">Delete</strong> your conversations and trips</li>
                <li><strong className="text-foreground">Close</strong> your account and request data deletion</li>
              </ul>
              <p className="mt-3">
                To delete your account or request your data, contact us at{' '}
                <a href="mailto:privacy@seira.app" className="text-primary hover:underline">
                  privacy@seira.app
                </a>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">cookies</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We use essential cookies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Keep you signed in</li>
                <li>Remember your preferences (like sidebar state)</li>
              </ul>
              <p className="mt-3">
                We don't use advertising or tracking cookies.
              </p>
            </div>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">children's privacy</h2>
            <p className="text-muted-foreground">
              Seira is not intended for users under 13 years of age. We do not knowingly collect
              information from children under 13.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">changes to this policy</h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. If we make significant changes,
              we'll notify you through the app or by email.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-medium mb-3 lowercase">contact us</h2>
            <p className="text-muted-foreground">
              Questions about this policy? Email us at{' '}
              <a href="mailto:privacy@seira.app" className="text-primary hover:underline">
                privacy@seira.app
              </a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            terms of service
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
