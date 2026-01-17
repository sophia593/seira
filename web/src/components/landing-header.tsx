"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Menu, X, User, Settings, Map, LogOut } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// =============================================================================
// Navigation Links
// =============================================================================

const NAV_LINKS = [
  { href: "#how-it-works", label: "how it works", anchor: true },
  { href: "/pricing", label: "pricing", anchor: false },
  { href: "/contact", label: "contact", anchor: false },
]

// =============================================================================
// Skip to Content Link (Accessibility)
// =============================================================================

function SkipToContent() {
  return (
    <a
      href="#main"
      className={cn(
        "absolute left-4 top-4 z-[100]",
        "px-4 py-2 rounded-lg",
        "bg-primary text-primary-foreground text-sm font-medium",
        "opacity-0 pointer-events-none",
        "focus:opacity-100 focus:pointer-events-auto",
        "transition-opacity"
      )}
    >
      skip to content
    </a>
  )
}

// =============================================================================
// Beta Badge (neutral with dot, accents on hover)
// =============================================================================

function BetaBadge() {
  return (
    <span
      title="Seira is in beta — some results may be estimates."
      className={cn(
        "ml-2 inline-flex items-center rounded-full",
        "px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        "bg-muted text-muted-foreground",
        "transition-colors duration-200",
        "hover:bg-primary/10 hover:text-primary"
      )}
    >
      • beta
    </span>
  )
}

// =============================================================================
// User Dropdown (logged in)
// =============================================================================

interface UserDropdownProps {
  userEmail?: string
}

function UserDropdown({ userEmail }: UserDropdownProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full",
            "bg-muted text-foreground text-sm font-medium",
            "hover:bg-muted/80 transition-colors"
          )}
          aria-label="Open user menu"
        >
          {userEmail ? userEmail[0].toUpperCase() : <User className="w-4 h-4" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {userEmail && (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
              {userEmail}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <Link href="/chat" className="cursor-pointer">
            <ArrowRight className="w-4 h-4 mr-2" />
            try seira
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/trips" className="cursor-pointer">
            <Map className="w-4 h-4 mr-2" />
            my trips
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// =============================================================================
// Mobile Menu
// =============================================================================

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  user: boolean
  loading: boolean
  userEmail?: string
}

function MobileMenu({ isOpen, onClose, user, loading, userEmail }: MobileMenuProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClose()
    router.push("/")
    router.refresh()
  }

  function handleAnchorClick(href: string) {
    onClose()
    setTimeout(() => {
      const element = document.querySelector(href)
      element?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-72 bg-background border-l shadow-lg z-50 transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-medium">menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="p-4 space-y-1">
          {NAV_LINKS.map((link) =>
            link.anchor ? (
              <button
                key={link.href}
                onClick={() => handleAnchorClick(link.href)}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="block px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          {loading ? (
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
          ) : user ? (
            <div className="space-y-2">
              {userEmail && (
                <div className="px-3 py-1 text-xs text-muted-foreground truncate">
                  {userEmail}
                </div>
              )}

              <Link
                href="/chat"
                onClick={onClose}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                try seira
              </Link>

              <Link
                href="/trips"
                onClick={onClose}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                <Map className="w-4 h-4" />
                my trips
              </Link>

              <Link
                href="/settings"
                onClick={onClose}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                <Settings className="w-4 h-4" />
                settings
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                log out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full px-3 py-2.5 rounded-lg text-sm text-center hover:bg-accent transition-colors"
              >
                log in
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block w-full px-3 py-2.5 rounded-lg text-sm text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Main Header Component
// =============================================================================

export function LandingHeader() {
  const { user, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Track scroll position for header styling
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8)
    }

    handleScroll() // Check initial position
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    const element = document.querySelector(href)
    element?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <>
      <SkipToContent />

      {/* Sticky wrapper */}
      <div
        className={cn(
          "sticky top-0 z-50 w-full backdrop-blur transition-all duration-200",
          isScrolled
            ? "bg-background/90 shadow-sm border-b"
            : "bg-background/80 border-b border-transparent"
        )}
      >
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full">
          {/* Logo + Beta Badge */}
          <div className="flex items-center">
            <Logo className="text-lg sm:text-xl" linkToHome={false} />
            <BetaBadge />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.anchor ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className={cn(
                    "text-sm text-muted-foreground hover:text-foreground",
                    "px-2.5 py-1.5 rounded-md",
                    "hover:bg-accent transition-colors"
                  )}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm text-muted-foreground hover:text-foreground",
                    "px-2.5 py-1.5 rounded-md",
                    "hover:bg-accent transition-colors"
                  )}
                >
                  {link.label}
                </Link>
              )
            )}

            {/* My Trips link for logged-in users */}
            {user && (
              <Link
                href="/trips"
                className={cn(
                  "text-sm text-muted-foreground hover:text-foreground",
                  "px-2.5 py-1.5 rounded-md",
                  "hover:bg-accent transition-colors"
                )}
              >
                my trips
              </Link>
            )}

            {/* Divider spacing */}
            <div className="w-3" />

            {/* Auth + CTA */}
            {loading ? (
              <div className="h-9 w-40 bg-muted rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Button asChild className="h-9">
                  <Link href="/chat">
                    try seira
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <UserDropdown userEmail={user.email} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="h-9 px-3 text-sm">
                  <Link href="/login">log in</Link>
                </Button>
                <Button asChild variant="ghost" className="h-9 px-3 text-sm">
                  <Link href="/signup">sign up</Link>
                </Button>
                <Button asChild className="h-9">
                  <Link href="/chat">
                    try seira
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={!!user}
        loading={loading}
        userEmail={user?.email}
      />
    </>
  )
}
