"use client"

import Link from "next/link"
import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/api/client"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarItemProps {
  conversation: Conversation
  isActive: boolean
  isCollapsed: boolean
  isDeleting?: boolean
  onDelete?: (id: string) => void
}

export function SidebarItem({
  conversation,
  isActive,
  isCollapsed,
  isDeleting,
  onDelete,
}: SidebarItemProps) {
  const title = conversation.title || "new conversation"

  // For collapsed sidebar, just show the link with tooltip
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/chat/${conversation.id}`}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-150",
              "hover:bg-accent",
              isActive && "bg-accent",
              isDeleting && "opacity-40 scale-[0.97] bg-destructive/10"
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    )
  }

  // For expanded sidebar, show link with X button on hover
  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-150",
        "hover:bg-accent",
        isActive && "bg-accent",
        isDeleting && "opacity-40 scale-[0.97] bg-destructive/10"
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{title}</span>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete?.(conversation.id)
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </Link>
  )
}
