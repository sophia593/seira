"use client"

import Link from "next/link"
import { Instagram, Mail } from "lucide-react"
import { Logo } from "@/components/logo"

// =============================================================================
// Footer Component
// =============================================================================

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
          {/* Logo */}
          <Logo linkToHome={true} />

          {/* Links */}
          <nav className="flex items-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-all active:scale-[0.97] px-2 py-1 rounded-lg hover:bg-accent"
            >
              privacy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-all active:scale-[0.97] px-2 py-1 rounded-lg hover:bg-accent"
            >
              terms
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-all active:scale-[0.97] px-2 py-1 rounded-lg hover:bg-accent"
            >
              contact
            </Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © 2026 seira
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            <a
              href="mailto:support@seira.global"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-[0.95]"
              aria-label="Email support@seira.global"
            >
              <Mail className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/seira.global"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-[0.95]"
              aria-label="Instagram @seira.global"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// Minimal Footer (single line)
// =============================================================================

export function FooterMinimal() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4 sm:gap-6">
            <span>© 2026 seira</span>
            <Link href="/privacy" className="hover:text-foreground transition-all active:scale-[0.97]">
              privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-all active:scale-[0.97]">
              terms
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-all active:scale-[0.97]">
              contact
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="mailto:support@seira.global"
              className="p-2 rounded-lg hover:text-foreground hover:bg-accent transition-all active:scale-[0.95]"
              aria-label="Email support@seira.global"
            >
              <Mail className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/seira.global"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:text-foreground hover:bg-accent transition-all active:scale-[0.95]"
              aria-label="Instagram @seira.global"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
