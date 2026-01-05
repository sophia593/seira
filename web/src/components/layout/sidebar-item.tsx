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

  const content = (
    <Link
      href={`/chat/${conversation.id}`}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent",
        isCollapsed ? "justify-center" : "justify-between"
      )}
    >
      <div className={cn("flex items-center gap-2 min-w-0", !isCollapsed && "flex-1")}>
        {isCollapsed ? (
          <MessageSquare className="h-4 w-4 shrink-0" />
        ) : (
          <>
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{title}</span>
          </>
        )}
      </div>

      {!isCollapsed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
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
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}
