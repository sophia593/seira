import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Database,
  Share2,
  Shield,
  Clock,
  Scale,
  Cookie,
  Baby,
  Globe,
  Bell,
  Mail,
  Ban
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'privacy policy',
  description: 'How Seira LLC collects, uses, and protects your personal information.',
  openGraph: {
    title: 'Privacy Policy — Seira',
    description: 'How Seira LLC collects, uses, and protects your personal information.',
  },
  twitter: { card: 'summary_large_image' },
}

// =============================================================================
// Section Component
// =============================================================================

interface SectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-base font-semibold lowercase">{title}</h2>
      </div>
      <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground pl-7">
        {children}
      </div>
    </section>
  )
}

// =============================================================================
// Main Page
// =============================================================================

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
        <p className="text-xs text-muted-foreground mb-2">
          effective date: january 1, 2026
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          last updated: february 12, 2026
        </p>

        {/* Introduction */}
        <div className="mb-10 text-[13px] leading-relaxed text-muted-foreground">
          <p className="mb-3">
            Seira LLC ("Seira," "we," "our," or "us") operates the Seira website and mobile application
            (collectively, the "Service"). This Privacy Policy describes how we collect, use, disclose,
            and otherwise process personal information in connection with our Service, and explains the
            rights and choices available to individuals with respect to their personal information.
          </p>
          <p>
            By accessing or using the Service, you acknowledge that you have read and understood this
            Privacy Policy. If you do not agree with our policies and practices, please do not use the Service.
          </p>
        </div>

        {/* Information We Collect */}
        <Section icon={<User className="w-4 h-4" />} title="information we collect">
          <p className="font-medium text-foreground">Information You Provide Directly</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Account Information:</span> When you create an account, we collect your email address, name, and password. If you sign in via Google OAuth, we receive your name, email address, and profile picture from Google.</li>
            <li><span className="font-medium text-foreground">Organization Data:</span> Events, partners, deliverables, and associated metadata that you create within your workspace.</li>
            <li><span className="font-medium text-foreground">Uploaded Files:</span> Proof-of-performance files (photos, videos, PDFs) that you upload to your workspace.</li>
            <li><span className="font-medium text-foreground">Payment Information:</span> When you subscribe, payment details are collected and processed by Stripe. We do not store your full credit card number.</li>
            <li><span className="font-medium text-foreground">Support Inquiries:</span> Information you provide when contacting us for customer support.</li>
          </ul>

          <p className="font-medium text-foreground mt-4">Information Collected Automatically</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Device Information:</span> Device type, operating system, browser type, and unique device identifiers.</li>
            <li><span className="font-medium text-foreground">Log Data:</span> IP address, access times, pages viewed, and the page you visited before navigating to our Service.</li>
            <li><span className="font-medium text-foreground">Usage Information:</span> Features used, actions taken, and interaction patterns within the Service.</li>
            <li><span className="font-medium text-foreground">Location Information:</span> General location based on IP address (we do not collect precise GPS location).</li>
          </ul>
        </Section>

        {/* How We Use Your Information */}
        <Section icon={<Database className="w-4 h-4" />} title="how we use your information">
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Provide the Service:</span> To operate, maintain, and deliver the features and functionality of the Service, including managing events, tracking deliverables, and generating reports.</li>
            <li><span className="font-medium text-foreground">Personalization:</span> To remember your preferences and provide personalized recommendations.</li>
            <li><span className="font-medium text-foreground">Communication:</span> To send you service-related notices, updates, security alerts, and administrative messages.</li>
            <li><span className="font-medium text-foreground">Improvement:</span> To analyze usage patterns, diagnose technical issues, and improve the Service.</li>
            <li><span className="font-medium text-foreground">Safety and Security:</span> To detect, prevent, and address fraud, abuse, and security issues.</li>
            <li><span className="font-medium text-foreground">Legal Compliance:</span> To comply with applicable laws, regulations, and legal processes.</li>
          </ul>

          <p className="mt-4 font-medium text-foreground">Legal Bases for Processing (EEA/UK Users)</p>
          <p className="mt-2">If you are located in the European Economic Area (EEA) or United Kingdom (UK), we process your personal information based on the following legal grounds:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Contract Performance:</span> Processing necessary to provide the Service you requested.</li>
            <li><span className="font-medium text-foreground">Legitimate Interests:</span> Processing necessary for our legitimate business interests, such as improving the Service and ensuring security.</li>
            <li><span className="font-medium text-foreground">Consent:</span> Processing based on your consent, which you may withdraw at any time.</li>
            <li><span className="font-medium text-foreground">Legal Obligation:</span> Processing necessary to comply with legal requirements.</li>
          </ul>
        </Section>

        {/* Sharing of Information */}
        <Section icon={<Share2 className="w-4 h-4" />} title="sharing of information">
          <p>We may share your information with the following categories of third parties:</p>

          <p className="font-medium text-foreground mt-4">Service Providers</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Supabase:</span> Database hosting, user authentication, and file storage services.</li>
            <li><span className="font-medium text-foreground">Vercel:</span> Website hosting and deployment.</li>
            <li><span className="font-medium text-foreground">Stripe:</span> Payment processing and subscription billing.</li>
            <li><span className="font-medium text-foreground">Vercel Analytics:</span> Anonymous, cookieless website analytics and performance monitoring.</li>
          </ul>

          <p className="font-medium text-foreground mt-4">Other Disclosures</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Legal Requirements:</span> When required by law, regulation, or legal process.</li>
            <li><span className="font-medium text-foreground">Protection of Rights:</span> To protect the rights, property, or safety of Seira, our users, or others.</li>
            <li><span className="font-medium text-foreground">Business Transfers:</span> In connection with a merger, acquisition, or sale of assets.</li>
            <li><span className="font-medium text-foreground">With Consent:</span> With your consent or at your direction.</li>
          </ul>

          <p className="mt-4">
            <span className="font-medium text-foreground">We do not sell your personal information.</span> We do not share your personal information with third parties for their direct marketing purposes.
          </p>
        </Section>

        {/* Data Security */}
        <Section icon={<Shield className="w-4 h-4" />} title="data security">
          <p>
            We implement appropriate technical and organizational security measures designed to protect
            your personal information against unauthorized access, alteration, disclosure, or destruction.
            These measures include:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li>Encryption of data in transit using TLS/SSL protocols</li>
            <li>Encryption of data at rest</li>
            <li>Row-level security ensuring users can only access their own data</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls limiting employee access to personal information</li>
          </ul>
          <p className="mt-3">
            While we strive to protect your personal information, no method of transmission over the
            Internet or electronic storage is completely secure. We cannot guarantee absolute security.
          </p>
        </Section>

        {/* Data Retention */}
        <Section icon={<Clock className="w-4 h-4" />} title="data retention">
          <p>
            We retain your personal information for as long as necessary to provide the Service, comply
            with our legal obligations, resolve disputes, and enforce our agreements. Specifically:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Account Information:</span> Retained until you delete your account.</li>
            <li><span className="font-medium text-foreground">Organization Data:</span> Events, partners, and deliverables retained until deleted by workspace owner or account closure.</li>
            <li><span className="font-medium text-foreground">Uploaded Files:</span> Proof files retained until deleted or account closure.</li>
            <li><span className="font-medium text-foreground">Log Data:</span> Retained for up to 90 days for security and debugging purposes.</li>
          </ul>
          <p className="mt-3">
            When you delete your account, we will delete or anonymize your personal information within
            30 days, except where we are required to retain certain information for legal or legitimate
            business purposes.
          </p>
        </Section>

        {/* Your Rights - GDPR & CCPA */}
        <Section icon={<Scale className="w-4 h-4" />} title="your privacy rights">
          <p className="font-medium text-foreground">Rights for All Users</p>
          <p className="mt-2">Regardless of your location, you may:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li>Access and update your account information through Settings</li>
            <li>Delete your events, partners, and uploaded proof files at any time</li>
            <li>Delete your account and all associated data</li>
            <li>Contact us to request information about your data</li>
          </ul>

          <p className="font-medium text-foreground mt-6">Additional Rights for EEA/UK Residents (GDPR)</p>
          <p className="mt-2">If you are located in the European Economic Area or United Kingdom, you have the following additional rights under the General Data Protection Regulation (GDPR):</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Right of Access:</span> Request a copy of the personal information we hold about you.</li>
            <li><span className="font-medium text-foreground">Right to Rectification:</span> Request correction of inaccurate or incomplete personal information.</li>
            <li><span className="font-medium text-foreground">Right to Erasure:</span> Request deletion of your personal information ("right to be forgotten").</li>
            <li><span className="font-medium text-foreground">Right to Restriction:</span> Request restriction of processing of your personal information.</li>
            <li><span className="font-medium text-foreground">Right to Data Portability:</span> Request transfer of your personal information in a structured, machine-readable format.</li>
            <li><span className="font-medium text-foreground">Right to Object:</span> Object to processing of your personal information for certain purposes.</li>
            <li><span className="font-medium text-foreground">Right to Withdraw Consent:</span> Withdraw consent at any time where processing is based on consent.</li>
          </ul>
          <p className="mt-3">
            You also have the right to lodge a complaint with a supervisory authority in your country of residence.
          </p>

          <p className="font-medium text-foreground mt-6">Additional Rights for California Residents (CCPA/CPRA)</p>
          <p className="mt-2">If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li><span className="font-medium text-foreground">Right to Know:</span> Request disclosure of the categories and specific pieces of personal information we have collected about you, the sources of collection, the purposes for collection, and the categories of third parties with whom we share personal information.</li>
            <li><span className="font-medium text-foreground">Right to Delete:</span> Request deletion of personal information we have collected from you, subject to certain exceptions.</li>
            <li><span className="font-medium text-foreground">Right to Correct:</span> Request correction of inaccurate personal information.</li>
            <li><span className="font-medium text-foreground">Right to Opt-Out of Sale/Sharing:</span> We do not sell or share your personal information for cross-context behavioral advertising.</li>
            <li><span className="font-medium text-foreground">Right to Limit Use of Sensitive Personal Information:</span> We do not use or disclose sensitive personal information for purposes other than those permitted under CCPA.</li>
            <li><span className="font-medium text-foreground">Right to Non-Discrimination:</span> We will not discriminate against you for exercising your privacy rights.</li>
          </ul>

          <p className="mt-4">
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:support@seira.global" className="text-primary hover:underline">
              support@seira.global
            </a>
            . We will respond to verifiable requests within the timeframes required by applicable law
            (generally 30 days for GDPR requests and 45 days for CCPA requests).
          </p>
        </Section>

        {/* Cookies */}
        <Section icon={<Cookie className="w-4 h-4" />} title="cookies and tracking technologies">
          <p>We use cookies and similar tracking technologies to operate and improve the Service:</p>

          <p className="font-medium text-foreground mt-4">Essential Cookies</p>
          <p className="mt-1">Required for the Service to function properly:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li>Authentication cookies to keep you signed in</li>
            <li>Session cookies to maintain your session state</li>
            <li>Security cookies to prevent fraud and protect the Service</li>
          </ul>

          <p className="font-medium text-foreground mt-4">Functional Cookies</p>
          <p className="mt-1">Used to remember your preferences:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li>Theme preference (light/dark mode)</li>
            <li>Sidebar state (expanded/collapsed)</li>
          </ul>

          <p className="mt-4">
            <span className="font-medium text-foreground">We do not use advertising or third-party tracking cookies.</span> We do not engage in cross-site tracking or targeted advertising.
          </p>

          <p className="mt-3">
            Most web browsers allow you to control cookies through their settings. Note that disabling
            essential cookies may prevent you from using certain features of the Service.
          </p>
        </Section>

        {/* Children's Privacy */}
        <Section icon={<Baby className="w-4 h-4" />} title="children's privacy">
          <p>
            The Service is not intended for children under the age of 13 (or 16 in the EEA/UK). We do
            not knowingly collect personal information from children under these ages. If we learn that
            we have collected personal information from a child under the applicable age, we will take
            steps to delete such information promptly.
          </p>
          <p className="mt-3">
            If you are a parent or guardian and believe your child has provided us with personal
            information, please contact us at{' '}
            <a href="mailto:support@seira.global" className="text-primary hover:underline">
              support@seira.global
            </a>
            .
          </p>
        </Section>

        {/* International Transfers */}
        <Section icon={<Globe className="w-4 h-4" />} title="international data transfers">
          <p>
            Seira LLC is based in the United States. If you access the Service from outside the United
            States, your personal information may be transferred to, stored, and processed in the United
            States or other countries where our service providers operate.
          </p>
          <p className="mt-3">
            For transfers of personal information from the EEA or UK to countries not deemed to provide
            an adequate level of data protection, we rely on appropriate safeguards, such as Standard
            Contractual Clauses approved by the European Commission, to ensure your personal information
            is protected in accordance with this Privacy Policy.
          </p>
        </Section>

        {/* Do Not Track */}
        <Section icon={<Ban className="w-4 h-4" />} title="do not track signals">
          <p>
            Some web browsers have a "Do Not Track" (DNT) feature that sends a signal to websites you
            visit indicating you do not want to be tracked. Because there is no common understanding of
            how to interpret DNT signals, the Service does not currently respond to DNT browser signals.
            However, as stated above, we do not engage in cross-site tracking or targeted advertising.
          </p>
        </Section>

        {/* Changes to Policy */}
        <Section icon={<Bell className="w-4 h-4" />} title="changes to this privacy policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technologies, legal requirements, or other factors. When we make material changes, we will:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
            <li>Update the "Last Updated" date at the top of this page</li>
            <li>Notify you by email or through a prominent notice within the Service</li>
            <li>Where required by law, obtain your consent to the changes</li>
          </ul>
          <p className="mt-3">
            We encourage you to review this Privacy Policy periodically to stay informed about how we
            protect your information.
          </p>
        </Section>

        {/* Contact */}
        <Section icon={<Mail className="w-4 h-4" />} title="contact us">
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data
            practices, please contact us:
          </p>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="font-medium text-foreground">Seira LLC</p>
            <p className="mt-2">
              Email:{' '}
              <a href="mailto:support@seira.global" className="text-primary hover:underline">
                support@seira.global
              </a>
            </p>
          </div>
          <p className="mt-4">
            For GDPR-related inquiries, you may also contact our designated representative for data
            protection matters at the email address above.
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            terms of service
          </Link>
          <span className="mx-2">•</span>
          <a href="mailto:support@seira.global" className="hover:text-foreground transition-colors">
            support
          </a>
          <span className="mx-2">•</span>
          <Link href="/" className="hover:text-foreground transition-colors">
            back to seira
          </Link>
        </div>
      </main>
    </div>
  )
}
