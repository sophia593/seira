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
  onRename?: (id: string) => void
  onDelete?: (id: string) => void
}

export function SidebarItem({
  conversation,
  isActive,
  isCollapsed,
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
              "flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              "hover:bg-accent",
              isActive && "bg-accent"
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    )
  }

  // For expanded sidebar, use a div wrapper with Link and separate dropdown
  const content = (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <Link
        href={`/chat/${conversation.id}`}
        className="flex items-center gap-2 min-w-0 flex-1"
      >
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{title}</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 opacity-60 hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onRename?.(conversation.id)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete?.(conversation.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return content
}
