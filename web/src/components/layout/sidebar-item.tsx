"use client"

import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  onRename?: (id: string) => void
  onDelete?: (id: string) => void
}

export function SidebarItem({
  conversation,
  isActive,
  isCollapsed,
  isDeleting,
  onRename,
  onDelete,
}: SidebarItemProps) {
  const title = conversation.title || "New conversation"

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

  // For expanded sidebar, show link with menu button
  return (
    <div
      className={cn(
        "group relative flex items-center rounded-md text-sm transition-all duration-150",
        "hover:bg-accent",
        isActive && "bg-accent",
        isDeleting && "opacity-40 scale-[0.97] bg-destructive/10"
      )}
    >
      <Link
        href={`/chat/${conversation.id}`}
        className="flex items-center gap-2 min-w-0 flex-1 px-2 py-1.5"
      >
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate pr-6">{title}</span>
      </Link>

      {/* Always visible menu button */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted text-muted-foreground/70 hover:text-foreground transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 z-[100]">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onRename?.(conversation.id)
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(conversation.id)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
