"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Plus,
  MessageSquare,
  Search,
  X,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  Check,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConversationListSkeleton } from "@/components/chat/conversation-list-skeleton"
import { UserMenu } from "./user-menu"

// =============================================================================
// Types
// =============================================================================

interface SidebarProps {
  /** When true, hides the collapse toggle (used in mobile drawer) */
  isMobile?: boolean
}

interface ConversationWithMeta extends Conversation {
  isPinned?: boolean
}

interface ConversationGroups {
  pinned: ConversationWithMeta[]
  today: ConversationWithMeta[]
  yesterday: ConversationWithMeta[]
  thisWeek: ConversationWithMeta[]
  thisMonth: ConversationWithMeta[]
  older: ConversationWithMeta[]
}

// =============================================================================
// Constants
// =============================================================================

const MAX_CONVERSATIONS = 50
const PINNED_STORAGE_KEY = "seira-pinned-conversations"

// =============================================================================
// Date Helpers
// =============================================================================

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function isToday(date: Date): boolean {
  const today = startOfDay(new Date())
  const target = startOfDay(date)
  return today.getTime() === target.getTime()
}

function isYesterday(date: Date): boolean {
  const yesterday = startOfDay(new Date())
  yesterday.setDate(yesterday.getDate() - 1)
  const target = startOfDay(date)
  return yesterday.getTime() === target.getTime()
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  return date >= weekAgo && !isToday(date) && !isYesterday(date)
}

function isThisMonth(date: Date): boolean {
  const now = new Date()
  const monthAgo = new Date(now)
  monthAgo.setDate(monthAgo.getDate() - 30)
  return date >= monthAgo && !isThisWeek(date) && !isToday(date) && !isYesterday(date)
}

// =============================================================================
// Grouping Logic
// =============================================================================

function groupConversations(
  conversations: ConversationWithMeta[],
  pinnedIds: Set<string>
): ConversationGroups {
  const groups: ConversationGroups = {
    pinned: [],
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  }

  for (const conv of conversations) {
    const isPinned = pinnedIds.has(conv.id)
    const convWithMeta = { ...conv, isPinned }

    if (isPinned) {
      groups.pinned.push(convWithMeta)
      continue
    }

    const date = new Date(conv.updated_at)

    if (isToday(date)) {
      groups.today.push(convWithMeta)
    } else if (isYesterday(date)) {
      groups.yesterday.push(convWithMeta)
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(convWithMeta)
    } else if (isThisMonth(date)) {
      groups.thisMonth.push(convWithMeta)
    } else {
      groups.older.push(convWithMeta)
    }
  }

  return groups
}

// =============================================================================
// Pinned Storage
// =============================================================================

function loadPinnedIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const stored = localStorage.getItem(PINNED_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function savePinnedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Ignore storage errors
  }
}

// =============================================================================
// Search Component
// =============================================================================

interface ConversationSearchProps {
  value: string
  onChange: (value: string) => void
  isCollapsed: boolean
}

function ConversationSearch({ value, onChange, isCollapsed }: ConversationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="w-full"
            onClick={() => inputRef.current?.focus()}
          >
            <Search className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">search (⌘K)</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="search..."
        className="w-full h-8 pl-8 pr-8 text-sm bg-muted/50 border-0 rounded-md placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// =============================================================================
// Conversation Group Header
// =============================================================================

interface GroupHeaderProps {
  title: string
  count: number
  isCollapsed: boolean
}

function GroupHeader({ title, count, isCollapsed }: GroupHeaderProps) {
  if (isCollapsed) return null

  return (
    <div className="flex items-center justify-between px-2 py-1.5 mt-2 first:mt-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </span>
      <span className="text-xs text-muted-foreground/60">{count}</span>
    </div>
  )
}

// =============================================================================
// Sidebar Item with Context Menu
// =============================================================================

interface SidebarItemProps {
  conversation: ConversationWithMeta
  isActive: boolean
  isCollapsed: boolean
  isDeleting?: boolean
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
}

function SidebarItem({
  conversation,
  isActive,
  isCollapsed,
  isDeleting,
  onDelete,
  onRename,
  onTogglePin,
}: SidebarItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const title = conversation.title || "new conversation"

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditValue(title)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isEditing, title])

  function handleStartEdit() {
    setIsEditing(true)
  }

  function handleSaveEdit() {
    if (editValue.trim() && editValue !== title) {
      onRename(conversation.id, editValue.trim())
    }
    setIsEditing(false)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditValue("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSaveEdit()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  // Collapsed view - just icon with tooltip
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/chat/${conversation.id}`}
            className={cn(
              "flex items-center justify-center rounded-md p-2 transition-all duration-150",
              "hover:bg-accent",
              isActive && "bg-accent",
              isDeleting && "opacity-40 scale-[0.97] bg-destructive/10"
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            {conversation.isPinned && (
              <Pin className="h-2 w-2 absolute top-1 right-1 text-primary" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="truncate">{title}</p>
          {conversation.isPinned && (
            <p className="text-xs text-muted-foreground">pinned</p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  // Expanded view with inline editing
  if (isEditing) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5",
          "bg-accent ring-1 ring-primary/30"
        )}
      >
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="flex-1 bg-transparent text-sm outline-none"
          maxLength={100}
        />
        <button
          onClick={handleSaveEdit}
          className="p-1 hover:bg-muted rounded"
        >
          <Check className="w-3.5 h-3.5 text-primary" />
        </button>
        <button
          onClick={handleCancelEdit}
          className="p-1 hover:bg-muted rounded"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    )
  }

  // Normal expanded view with context menu
  return (
    <div
      className={cn(
        "group relative flex items-center rounded-md transition-all duration-150",
        "hover:bg-accent",
        isActive && "bg-accent",
        isDeleting && "opacity-40 scale-[0.97] bg-destructive/10"
      )}
    >
      <Link
        href={`/chat/${conversation.id}`}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 min-w-0"
      >
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm">{title}</span>
        {conversation.isPinned && (
          <Pin className="h-3 w-3 shrink-0 text-primary/70" />
        )}
      </Link>

      {/* Context Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "absolute right-1 p-1.5 rounded opacity-0 group-hover:opacity-100",
              "hover:bg-muted transition-opacity",
              "focus:opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleStartEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTogglePin(conversation.id)}>
            {conversation.isPinned ? (
              <>
                <PinOff className="w-4 h-4 mr-2" />
                unpin
              </>
            ) : (
              <>
                <Pin className="w-4 h-4 mr-2" />
                pin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(conversation.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// =============================================================================
// Conversation Group
// =============================================================================

interface ConversationGroupProps {
  title: string
  conversations: ConversationWithMeta[]
  currentId: string | undefined
  isCollapsed: boolean
  deletingId: string | null
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
}

function ConversationGroup({
  title,
  conversations,
  currentId,
  isCollapsed,
  deletingId,
  onDelete,
  onRename,
  onTogglePin,
}: ConversationGroupProps) {
  if (conversations.length === 0) return null

  return (
    <div>
      <GroupHeader title={title} count={conversations.length} isCollapsed={isCollapsed} />
      <div className="space-y-0.5">
        {conversations.map((conv) => (
          <SidebarItem
            key={conv.id}
            conversation={conv}
            isActive={currentId === conv.id}
            isCollapsed={isCollapsed}
            isDeleting={deletingId === conv.id}
            onDelete={onDelete}
            onRename={onRename}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <div className="py-4 text-center">
        <span className="text-muted-foreground">—</span>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 text-center">
      <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">no conversations yet</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        click "new chat" to start
      </p>
    </div>
  )
}

// =============================================================================
// Search Empty State
// =============================================================================

function SearchEmptyState({ query, isCollapsed }: { query: string; isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <div className="py-4 text-center">
        <Search className="h-4 w-4 mx-auto text-muted-foreground/50" />
      </div>
    )
  }

  return (
    <div className="py-8 px-4 text-center">
      <Search className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">
        no results for "{query}"
      </p>
    </div>
  )
}

// =============================================================================
// Main Sidebar Component
// =============================================================================

export function Sidebar({ isMobile = false }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const currentConversationId = params?.id as string | undefined

  const { isCollapsed: storedCollapsed, toggle } = useSidebar()
  // In mobile mode, always show expanded sidebar
  const isCollapsed = isMobile ? false : storedCollapsed

  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Load pinned IDs from localStorage
  useEffect(() => {
    setPinnedIds(loadPinnedIds())
  }, [])

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
  }, [currentConversationId])

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations

    const query = searchQuery.toLowerCase()
    return conversations.filter((conv) =>
      conv.title?.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  // Group conversations
  const groups = useMemo(
    () => groupConversations(filteredConversations, pinnedIds),
    [filteredConversations, pinnedIds]
  )

  // Handlers
  const handleNewChat = useCallback(async () => {
    setIsCreating(true)
    try {
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
  }, [router])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    await new Promise((r) => setTimeout(r, 200))

    const previousConversations = conversations
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setDeletingId(null)

    // Remove from pinned if needed
    if (pinnedIds.has(id)) {
      const newPinned = new Set(pinnedIds)
      newPinned.delete(id)
      setPinnedIds(newPinned)
      savePinnedIds(newPinned)
    }

    if (currentConversationId === id) {
      startNewConversation()
      router.push("/chat")
    }

    try {
      const api = getApi()
      await api.deleteConversation(id)
    } catch {
      setConversations(previousConversations)
      toast.error("couldn't delete conversation")
    }
  }, [conversations, currentConversationId, pinnedIds, router])

  const handleRename = useCallback(async (id: string, title: string) => {
    // Optimistic update
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    )

    try {
      const api = getApi()
      await api.updateConversation(id, { title })
    } catch {
      toast.error("couldn't rename conversation")
      // Refetch to restore correct state
      const api = getApi()
      const data = await api.getConversations()
      setConversations(data)
    }
  }, [])

  const handleTogglePin = useCallback((id: string) => {
    const newPinned = new Set(pinnedIds)
    if (newPinned.has(id)) {
      newPinned.delete(id)
    } else {
      newPinned.add(id)
    }
    setPinnedIds(newPinned)
    savePinnedIds(newPinned)
  }, [pinnedIds])

  // Computed
  const totalCount = conversations.length
  const hasSearch = searchQuery.trim().length > 0
  const hasNoResults = hasSearch && filteredConversations.length === 0
  const hasNoConversations = !hasSearch && conversations.length === 0

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
              {totalCount > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {totalCount}
                </span>
              )}
            </Link>
          )}
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

        {/* Search */}
        {totalCount > 3 && (
          <div className="px-2 pb-2">
            <ConversationSearch
              value={searchQuery}
              onChange={setSearchQuery}
              isCollapsed={isCollapsed}
            />
          </div>
        )}

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-2">
          <div className="py-2">
            {isLoading ? (
              <ConversationListSkeleton count={5} />
            ) : hasNoConversations ? (
              <EmptyState isCollapsed={isCollapsed} />
            ) : hasNoResults ? (
              <SearchEmptyState query={searchQuery} isCollapsed={isCollapsed} />
            ) : (
              <div className="space-y-2">
                {/* Pinned */}
                <ConversationGroup
                  title="pinned"
                  conversations={groups.pinned}
                  currentId={currentConversationId}
                  isCollapsed={isCollapsed}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onTogglePin={handleTogglePin}
                />

                {/* Today */}
                <ConversationGroup
                  title="today"
                  conversations={groups.today}
                  currentId={currentConversationId}
                  isCollapsed={isCollapsed}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onTogglePin={handleTogglePin}
                />

                {/* Yesterday */}
                <ConversationGroup
                  title="yesterday"
                  conversations={groups.yesterday}
                  currentId={currentConversationId}
                  isCollapsed={isCollapsed}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onTogglePin={handleTogglePin}
                />

                {/* This Week */}
                <ConversationGroup
                  title="this week"
                  conversations={groups.thisWeek}
                  currentId={currentConversationId}
                  isCollapsed={isCollapsed}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onTogglePin={handleTogglePin}
                />

                {/* This Month */}
                <ConversationGroup
                  title="this month"
                  conversations={groups.thisMonth}
                  currentId={currentConversationId}
                  isCollapsed={isCollapsed}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onTogglePin={handleTogglePin}
                />

                {/* Older */}
                <ConversationGroup
                  title="older"
                  conversations={groups.older}
                  currentId={currentConversationId}
                  isCollapsed={isCollapsed}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onTogglePin={handleTogglePin}
                />
              </div>
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
