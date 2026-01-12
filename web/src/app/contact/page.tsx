import { Logo } from "@/components/logo"
import { Mail, Instagram } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-4xl mx-auto w-full">
        <Logo />
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h1 className="text-2xl sm:text-4xl font-semibold mb-6 lowercase">contact us</h1>

        <div className="space-y-8 text-muted-foreground">
          <p>
            have questions about seira? we&apos;d love to hear from you.
          </p>

          <div className="space-y-4">
            <a
              href="mailto:support@seira.global"
              className="flex items-center gap-3 p-4 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground group-hover:text-primary transition-colors">email</div>
                <div className="text-sm">support@seira.global</div>
              </div>
            </a>

            <a
              href="https://instagram.com/seira.global"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground group-hover:text-primary transition-colors">instagram</div>
                <div className="text-sm">@seira.global</div>
              </div>
            </a>
          </div>

          <p className="text-sm">
            we typically respond within 24 hours.
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
