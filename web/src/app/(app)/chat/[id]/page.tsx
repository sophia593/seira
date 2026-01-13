"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat"
import { getApi } from "@/lib/api"
import { useConversationStore } from "@/stores/conversation-store"

// =============================================================================
// Types
// =============================================================================

interface ChatPageProps {
  params: Promise<{ id: string }>
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TITLE = "chat | seira"
const TITLE_MAX_LENGTH = 50

// =============================================================================
// Helpers
// =============================================================================

function formatTitle(title: string | null | undefined): string {
  if (!title || title.trim() === "") {
    return DEFAULT_TITLE
  }

  // Truncate long titles
  const cleaned = title.trim().toLowerCase()
  if (cleaned.length > TITLE_MAX_LENGTH) {
    return `${cleaned.slice(0, TITLE_MAX_LENGTH)}... | seira`
  }

  return `${cleaned} | seira`
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function ChatConversationPage({ params }: ChatPageProps) {
  const { id } = use(params)
  const router = useRouter()

  // Local state for title
  const [pageTitle, setPageTitle] = useState(DEFAULT_TITLE)

  // Get conversation from store (if already loaded)
  const conversations = useConversationStore((state) => state.conversations)
  const currentConversation = conversations.find((c) => c.id === id)

  // ===========================================================================
  // Validate conversation ID format
  // ===========================================================================

  useEffect(() => {
    if (!id || !isValidUUID(id)) {
      // Invalid ID format — redirect to new chat
      router.replace("/chat")
    }
  }, [id, router])

  // ===========================================================================
  // Update document title
  // ===========================================================================

  useEffect(() => {
    // First, try to get title from store (instant)
    if (currentConversation?.title) {
      const title = formatTitle(currentConversation.title)
      setPageTitle(title)
      document.title = title
      return
    }

    // Otherwise, fetch from API
    async function fetchConversationTitle() {
      try {
        const api = getApi()
        const data = await api.getConversation(id)

        if (data?.conversation?.title) {
          const title = formatTitle(data.conversation.title)
          setPageTitle(title)
          document.title = title
        }
      } catch {
        // Silent fail — keep default title
        // ChatInterface will handle the actual error
      }
    }

    fetchConversationTitle()
  }, [id, currentConversation?.title])

  // ===========================================================================
  // Reset title on unmount
  // ===========================================================================

  useEffect(() => {
    return () => {
      document.title = "seira"
    }
  }, [])

  // ===========================================================================
  // Track page view (for analytics later)
  // ===========================================================================

  useEffect(() => {
    // Placeholder for analytics
    // Could integrate with Mixpanel, Amplitude, etc.
    if (process.env.NODE_ENV === "development") {
      console.debug(`[analytics] Viewing conversation: ${id}`)
    }
  }, [id])

  // ===========================================================================
  // Don't render if invalid ID
  // ===========================================================================

  if (!id || !isValidUUID(id)) {
    return null // Will redirect in useEffect
  }

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="h-full flex flex-col">
      {/*
        Hidden SEO helper — screen readers can announce the page
        This also helps with accessibility
      */}
      <h1 className="sr-only">{pageTitle.replace(" | seira", "")}</h1>

      {/* Main chat interface */}
      <ChatInterface conversationId={id} />
    </div>
  )
}
