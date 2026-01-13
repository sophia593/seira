'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/components/chat'
import { Loader2 } from 'lucide-react'

// =============================================================================
// Constants
// =============================================================================

const PAGE_TITLE = "new chat | seira"

// =============================================================================
// Keyboard Hint Component
// =============================================================================

function KeyboardHint() {
  const [isMac, setIsMac] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Detect platform
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0)

    // Show hint after a short delay (don't distract from initial load)
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Hide on mobile (no keyboard shortcuts)
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return null
  }

  const modifier = isMac ? "⌘" : "Ctrl"

  return (
    <div
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-10
        px-3 py-1.5 rounded-full
        bg-muted/80 backdrop-blur-sm border
        text-xs text-muted-foreground
        transition-all duration-500
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <span className="hidden sm:inline">
        tip: press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">
          {modifier}
        </kbd>
        {" + "}
        <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">
          K
        </kbd>
        {" "}anywhere to start a new chat
      </span>
    </div>
  )
}

// =============================================================================
// Chat Page Content
// =============================================================================

function ChatPageContent() {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get('prompt') || undefined

  // ===========================================================================
  // Set page title
  // ===========================================================================

  useEffect(() => {
    document.title = PAGE_TITLE

    return () => {
      document.title = "seira"
    }
  }, [])

  // ===========================================================================
  // Track new chat (for analytics later)
  // ===========================================================================

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics] New chat started", {
        hasInitialPrompt: !!initialPrompt
      })
    }
  }, [initialPrompt])

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="h-full flex flex-col relative">
      {/* Accessibility */}
      <h1 className="sr-only">new chat</h1>

      {/* Main chat interface */}
      <ChatInterface initialPrompt={initialPrompt} />

      {/* Keyboard shortcut hint (desktop only) */}
      <KeyboardHint />
    </div>
  )
}

// =============================================================================
// Loading Fallback
// =============================================================================

function ChatPageLoading() {
  return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )
}

// =============================================================================
// Main Export (with Suspense for useSearchParams)
// =============================================================================

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  )
}
