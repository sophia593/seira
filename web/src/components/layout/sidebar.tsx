"use client"

import { useEffect, useState, useMemo, useCallback, useRef, memo } from "react"
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
import { UserMenu } from "./user-menu"

// =============================================================================
// Types
// =============================================================================

interface SidebarProps {
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

const PINNED_STORAGE_KEY = "seira-pinned-conversations"
const SEARCH_DEBOUNCE_MS = 150

// =============================================================================
// Hooks
// =============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

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
// Loading Skeleton
// =============================================================================

// Fixed widths to avoid hydration mismatch from Math.random()
const SKELETON_WIDTHS = [75, 82, 68, 78, 71]

function ConversationSkeleton() {
  return (
    <div className="space-y-1 px-1">
      {SKELETON_WIDTHS.map((width, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2 py-2 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="h-4 w-4 rounded bg-muted" />
          <div
            className="h-3 rounded bg-muted"
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Search Component
// =============================================================================

interface ConversationSearchProps {
  value: string
  onChange: (value: string) => void
  isCollapsed: boolean
}

const ConversationSearch = memo(function ConversationSearch({
  value,
  onChange,
  isCollapsed
}: ConversationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

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
          <Button variant="ghost" size="icon-sm" className="w-full">
            <Search className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">search (⌘K)</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div
      className={cn(
        "relative rounded-lg transition-all duration-200",
        isFocused && "ring-2 ring-primary/20"
      )}
    >
      <Search
        className={cn(
          "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors duration-150",
          isFocused ? "text-primary" : "text-muted-foreground"
        )}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="search..."
        className={cn(
          "w-full h-8 pl-8 pr-8 text-sm rounded-lg",
          "bg-muted/50 border-0",
          "placeholder:text-muted-foreground/60",
          "focus:outline-none focus:bg-muted/80",
          "transition-colors duration-150"
        )}
      />
      <div
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1",
          "transition-opacity duration-150",
          value ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <button
          onClick={() => onChange("")}
          className="p-0.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
})

// =============================================================================
// Group Header
// =============================================================================

interface GroupHeaderProps {
  title: string
  count: number
  isCollapsed: boolean
}

const GroupHeader = memo(function GroupHeader({ title, count, isCollapsed }: GroupHeaderProps) {
  if (isCollapsed) return null

  return (
    <div className="flex items-center justify-between px-2 py-1.5 mt-3 first:mt-0">
      <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
        {title}
      </span>
      <span className="text-[11px] text-muted-foreground/50 tabular-nums">{count}</span>
    </div>
  )
})

// =============================================================================
// Sidebar Item
// =============================================================================

interface SidebarItemProps {
  conversation: ConversationWithMeta
  isActive: boolean
  isCollapsed: boolean
  isDeleting?: boolean
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
  style?: React.CSSProperties
}

const SidebarItem = memo(function SidebarItem({
  conversation,
  isActive,
  isCollapsed,
  isDeleting,
  onDelete,
  onRename,
  onTogglePin,
  style,
}: SidebarItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const title = conversation.title || "new conversation"

  useEffect(() => {
    if (isEditing) {
      setEditValue(title)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isEditing, title])

  const handleSaveEdit = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== title) {
      onRename(conversation.id, trimmed)
    }
    setIsEditing(false)
  }, [editValue, title, conversation.id, onRename])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === "Escape") {
      setIsEditing(false)
    }
  }, [handleSaveEdit])

  // Collapsed view
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/chat/${conversation.id}`}
            className={cn(
              "relative flex items-center justify-center rounded-lg p-2",
              "transition-all duration-150 ease-out",
              "hover:bg-accent active:scale-95",
              isActive && "bg-accent shadow-sm",
              isDeleting && "opacity-0 scale-90 pointer-events-none"
            )}
            style={style}
          >
            <MessageSquare className="h-4 w-4" />
            {conversation.isPinned && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="truncate font-medium">{title}</p>
          {conversation.isPinned && (
            <p className="text-xs text-muted-foreground mt-0.5">pinned</p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  // Editing mode
  if (isEditing) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5",
          "bg-accent ring-2 ring-primary/30",
          "animate-in fade-in-0 duration-150"
        )}
        style={style}
      >
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="flex-1 min-w-0 bg-transparent text-sm outline-none"
          maxLength={100}
        />
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleSaveEdit}
            className="p-1 rounded hover:bg-background/50 transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-primary" />
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 rounded hover:bg-background/50 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  }

  // Normal view
  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg",
        "transition-all duration-150 ease-out",
        "hover:bg-accent",
        isActive && "bg-accent shadow-sm",
        isDeleting && "opacity-0 scale-95 -translate-x-2 pointer-events-none",
        isMenuOpen && "bg-accent"
      )}
      style={style}
    >
      <Link
        href={`/chat/${conversation.id}`}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 min-w-0"
      >
        <MessageSquare
          className={cn(
            "h-4 w-4 shrink-0 transition-colors duration-150",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
        />
        <span className="flex-1 truncate text-sm">{title}</span>
        {conversation.isPinned && (
          <Pin className="h-3 w-3 shrink-0 text-primary/60" />
        )}
      </Link>

      {/* Context Menu Trigger */}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "absolute right-1 p-1.5 rounded-md",
              "text-muted-foreground hover:text-foreground",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              "hover:bg-background/50",
              "transition-all duration-150",
              isMenuOpen && "opacity-100 bg-background/50"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-36"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
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
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

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

const ConversationGroup = memo(function ConversationGroup({
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
    <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
      <GroupHeader title={title} count={conversations.length} isCollapsed={isCollapsed} />
      <div className="space-y-0.5">
        {conversations.map((conv, index) => (
          <SidebarItem
            key={conv.id}
            conversation={conv}
            isActive={currentId === conv.id}
            isCollapsed={isCollapsed}
            isDeleting={deletingId === conv.id}
            onDelete={onDelete}
            onRename={onRename}
            onTogglePin={onTogglePin}
            style={{
              animationDelay: `${index * 20}ms`,
              animationFillMode: 'backwards'
            }}
          />
        ))}
      </div>
    </div>
  )
})

// =============================================================================
// Empty States
// =============================================================================

function EmptyState({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <div className="py-4 flex justify-center">
        <div className="w-1 h-8 bg-muted rounded-full" />
      </div>
    )
  }

  return (
    <div className="py-12 px-4 text-center animate-in fade-in-0 duration-300">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
        <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">no conversations yet</p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        start a new chat to begin planning
      </p>
    </div>
  )
}

function SearchEmptyState({ query, isCollapsed }: { query: string; isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <div className="py-4 flex justify-center">
        <Search className="h-4 w-4 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className="py-12 px-4 text-center animate-in fade-in-0 duration-200">
      <Search className="h-5 w-5 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        no results for "<span className="font-medium">{query}</span>"
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        try a different search term
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
  const isCollapsed = isMobile ? false : storedCollapsed

  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Debounced search for smoother filtering
  const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS)

  // Track if we've done initial load to prevent refetching
  const hasLoadedRef = useRef(false)
  const conversationsRef = useRef(conversations)
  conversationsRef.current = conversations

  // Load pinned IDs
  useEffect(() => {
    setPinnedIds(loadPinnedIds())
  }, [])

  // Fetch conversations once on mount
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

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
  }, [])

  // Filter with debounced search
  const filteredConversations = useMemo(() => {
    if (!debouncedSearch.trim()) return conversations

    const query = debouncedSearch.toLowerCase()
    return conversations.filter((conv) =>
      conv.title?.toLowerCase().includes(query)
    )
  }, [conversations, debouncedSearch])

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
    // Start delete animation
    setDeletingId(id)

    // Wait for animation
    await new Promise((r) => setTimeout(r, 200))

    // Optimistic update
    const previousConversations = conversationsRef.current
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setDeletingId(null)

    // Remove from pinned
    if (pinnedIds.has(id)) {
      const newPinned = new Set(pinnedIds)
      newPinned.delete(id)
      setPinnedIds(newPinned)
      savePinnedIds(newPinned)
    }

    // Navigate away if deleting current
    if (currentConversationId === id) {
      startNewConversation()
      router.push("/chat")
    }

    // API call
    try {
      const api = getApi()
      await api.deleteConversation(id)
      toast.success("conversation deleted")
    } catch {
      setConversations(previousConversations)
      toast.error("couldn't delete conversation")
    }
  }, [currentConversationId, pinnedIds, router])

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
      const api = getApi()
      const data = await api.getConversations()
      setConversations(data)
    }
  }, [])

  const handleTogglePin = useCallback((id: string) => {
    const newPinned = new Set(pinnedIds)
    const wasPinned = newPinned.has(id)

    if (wasPinned) {
      newPinned.delete(id)
    } else {
      newPinned.add(id)
    }

    setPinnedIds(newPinned)
    savePinnedIds(newPinned)
    toast.success(wasPinned ? "unpinned" : "pinned")
  }, [pinnedIds])

  // Computed
  const totalCount = conversations.length
  const hasSearch = debouncedSearch.trim().length > 0
  const hasNoResults = hasSearch && filteredConversations.length === 0
  const hasNoConversations = !hasSearch && conversations.length === 0

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r bg-background/95 backdrop-blur-sm",
          "transition-[width] duration-300 ease-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-14 items-center border-b px-3 shrink-0",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/chat"
            className={cn(
              "flex items-center gap-2 font-semibold lowercase",
              "transition-opacity duration-200",
              isCollapsed && "opacity-0 w-0 overflow-hidden"
            )}
          >
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span className="truncate">seira</span>
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md tabular-nums">
                {totalCount}
              </span>
            )}
          </Link>

          {isCollapsed && (
            <MessageSquare className="h-5 w-5 shrink-0" />
          )}

          {!isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggle}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    isCollapsed && "absolute right-1"
                  )}
                >
                  <ChevronLeft
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isCollapsed && "rotate-180"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "expand" : "collapse"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleNewChat}
                disabled={isCreating}
                className={cn(
                  "w-full gap-2 transition-all duration-200",
                  isCollapsed && "px-0"
                )}
                isLoading={isCreating}
              >
                {!isCreating && <Plus className="h-4 w-4 shrink-0" />}
                <span
                  className={cn(
                    "transition-all duration-200",
                    isCollapsed && "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  {isCreating ? "creating..." : "new chat"}
                </span>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">new chat</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Search - show when more than 3 conversations */}
        <div
          className={cn(
            "px-2 overflow-hidden transition-all duration-200 shrink-0",
            totalCount > 3 ? "pb-2 max-h-12 opacity-100" : "pb-0 max-h-0 opacity-0"
          )}
        >
          <ConversationSearch
            value={searchQuery}
            onChange={setSearchQuery}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-2">
          <div className="py-2">
            {isLoading ? (
              <ConversationSkeleton />
            ) : hasNoConversations ? (
              <EmptyState isCollapsed={isCollapsed} />
            ) : hasNoResults ? (
              <SearchEmptyState query={debouncedSearch} isCollapsed={isCollapsed} />
            ) : (
              <div className="space-y-1">
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
        <div className="border-t p-2 space-y-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/trips"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                  "transition-all duration-150",
                  "hover:bg-accent active:scale-[0.98]",
                  isCollapsed && "justify-center"
                )}
              >
                <Plane className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "transition-all duration-200",
                    isCollapsed && "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  my trips
                </span>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">my trips</TooltipContent>
            )}
          </Tooltip>

          <UserMenu isCollapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  )
}
