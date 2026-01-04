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

export function Sidebar() {
  const router = useRouter()
  const params = useParams()
  const currentConversationId = params?.id as string | undefined

  const { isCollapsed, toggle } = useSidebar()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Fetch conversations on mount
  useEffect(() => {
    async function fetchConversations() {
      try {
        const api = getApi()
        const data = await api.getConversations()
        setConversations(data)
      } catch (error) {
        if (error instanceof ApiError && error.status !== 401) {
          toast.error("Failed to load conversations")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

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
      toast.error("Failed to create conversation")
    } finally {
      setIsCreating(false)
    }
  }

  function handleRename(id: string) {
    // TODO: Implement rename dialog
    console.log("Rename:", id)
  }

  async function handleDelete(id: string) {
    try {
      const api = getApi()
      await api.deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      toast.success("Conversation deleted")

      if (currentConversationId === id) {
        router.push("/chat")
      }
    } catch {
      toast.error("Failed to delete conversation")
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
              className="flex items-center gap-2 font-semibold"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Seira</span>
            </Link>
          )}
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
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
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
                  <span>{isCreating ? "Creating..." : "New Chat"}</span>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">New Chat</TooltipContent>
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
                  onRename={handleRename}
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
                {!isCollapsed && <span>My Trips</span>}
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">My Trips</TooltipContent>
            )}
          </Tooltip>

          {/* User Menu */}
          <UserMenu isCollapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  )
}
