'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/components/chat'
import { Loader2, Sparkles } from 'lucide-react'

// =============================================================================
// Constants
// =============================================================================

const PAGE_TITLE = "new chat | seira"

const EXAMPLE_PROMPTS = [
  "taylor swift eras tour in los angeles",
  "lakers vs celtics next month",
  "coachella 2026 weekend 1",
  "f1 miami grand prix",
  "hamilton on broadway",
  "ufc 300 in vegas",
  "coldplay world tour near me",
  "super bowl 2027",
  "wimbledon finals",
  "comic con san diego",
]

// =============================================================================
// Keyboard Hint Component (auto-dismiss after 10s)
// =============================================================================

function KeyboardHint() {
  const [isMac, setIsMac] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Detect platform
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0)

    // Show hint after 2s delay
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    // Auto-dismiss after 10s (12s total from mount)
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, 12000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
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
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
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
// Example Prompts Component
// =============================================================================

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void
}

function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  // Randomly select 4 prompts on mount
  const [prompts, setPrompts] = useState<string[]>([])

  useEffect(() => {
    const shuffled = [...EXAMPLE_PROMPTS].sort(() => Math.random() - 0.5)
    setPrompts(shuffled.slice(0, 4))
  }, [])

  if (prompts.length === 0) return null

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Sparkles className="w-3 h-3" />
        <span>try asking about</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="text-left px-4 py-3 rounded-xl border bg-card text-sm text-muted-foreground lowercase
              hover:bg-muted/50 hover:border-primary/30 hover:text-foreground
              active:scale-[0.98] active:bg-primary/5 active:border-primary/50 active:shadow-inner
              transition-all duration-150"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Chat Page Content
// =============================================================================

function ChatPageContent() {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get('prompt') || undefined

  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>(initialPrompt)
  const [showExamples, setShowExamples] = useState(!initialPrompt)

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
  // Handle example prompt selection
  // ===========================================================================

  function handlePromptSelect(prompt: string) {
    setSelectedPrompt(prompt)
    setShowExamples(false)
  }

  // ===========================================================================
  // Handle when chat becomes active (hide examples)
  // ===========================================================================

  function handleChatActive() {
    setShowExamples(false)
  }

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="h-full flex flex-col relative">
      {/* Accessibility */}
      <h1 className="sr-only">new chat</h1>

      {/* Main chat interface */}
      <ChatInterface
        initialPrompt={selectedPrompt}
        onChatActive={handleChatActive}
        examplePromptsSlot={
          showExamples ? (
            <ExamplePrompts onSelect={handlePromptSelect} />
          ) : null
        }
      />

      {/* Keyboard shortcut hint (desktop only, auto-dismiss) */}
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
