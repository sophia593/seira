"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Plus,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { getApi, ApiError } from "@/lib/api"
import type { Conversation } from "@/lib/api/client"
import { startNewConversation } from "@/stores/conversation-store"
import { toast } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConversationListSkeleton } from "@/components/chat/conversation-list-skeleton"
import { SidebarItem } from "./sidebar-item"
import { UserMenu } from "./user-menu"

interface SidebarProps {
  /** When true, hides the collapse toggle (used in mobile drawer) */
  isMobile?: boolean
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const currentConversationId = params?.id as string | undefined

  const { isCollapsed: storedCollapsed, toggle } = useSidebar()
  // In mobile mode, always show expanded sidebar
  const isCollapsed = isMobile ? false : storedCollapsed
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch conversations on mount and when route changes
  useEffect(() => {
    async function fetchConversations() {
      try {
        const api = getApi()
        const data = await api.getConversations()
        setConversations(data)
      } catch (error) {
        if (error instanceof ApiError && error.status !== 401) {
          toast.error("couldn't load conversations")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [currentConversationId]) // Refetch when conversation changes

  async function handleNewChat() {
    setIsCreating(true)
    try {
      // Clear the conversation store for a fresh start
      startNewConversation()
      const api = getApi()
      const conversation = await api.createConversation()
      setConversations((prev) => [conversation, ...prev])
      router.push(`/chat/${conversation.id}`)
    } catch {
      toast.error("couldn't create conversation")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete(id: string) {
    // Brief visual feedback before deletion
    setDeletingId(id)

    // Small delay for visual feedback
    await new Promise((r) => setTimeout(r, 200))

    // Optimistic update
    const previousConversations = conversations
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setDeletingId(null)

    // Navigate away if deleting current conversation
    if (currentConversationId === id) {
      startNewConversation()
      router.push("/chat")
    }

    try {
      const api = getApi()
      await api.deleteConversation(id)
    } catch {
      // Rollback on failure
      setConversations(previousConversations)
      toast.error("couldn't delete conversation")
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r bg-background transition-[width] duration-200",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-14 items-center border-b px-3",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <Link
              href="/chat"
              className="flex items-center gap-2 font-semibold lowercase"
            >
              <MessageSquare className="h-5 w-5" />
              <span>seira</span>
            </Link>
          )}
          {/* Hide collapse toggle on mobile - drawer handles show/hide */}
          {!isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggle}
                  className="shrink-0"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "expand sidebar" : "collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleNewChat}
                disabled={isCreating}
                className={cn("w-full", isCollapsed && "px-0")}
                isLoading={isCreating}
              >
                {!isCreating && <Plus className="h-4 w-4" />}
                {!isCollapsed && (
                  <span>{isCreating ? "creating..." : "new chat"}</span>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">new chat</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {isLoading ? (
              <ConversationListSkeleton count={5} />
            ) : conversations.length === 0 ? (
              <div
                className={cn(
                  "py-4 text-center text-sm text-muted-foreground",
                  isCollapsed && "px-1 text-xs"
                )}
              >
                {isCollapsed ? (
                  <span>—</span>
                ) : (
                  <>
                    <p>no conversations yet</p>
                    <p className="text-xs mt-1 opacity-70">click "new chat" to start</p>
                  </>
                )}
              </div>
            ) : (
              conversations.slice(0, 20).map((conversation) => (
                <SidebarItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversationId === conversation.id}
                  isCollapsed={isCollapsed}
                  isDeleting={deletingId === conversation.id}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="border-t p-2 space-y-1">
          {/* My Trips Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/trips"
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                  isCollapsed && "justify-center"
                )}
              >
                <Plane className="h-4 w-4" />
                {!isCollapsed && <span>my trips</span>}
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">my trips</TooltipContent>
            )}
          </Tooltip>

          {/* User Menu */}
          <UserMenu isCollapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  )
}
