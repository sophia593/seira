"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import { AvatarUser } from "@/components/ui/avatar"
import { useUserStore } from "@/stores/user-store"

interface UserMessageProps {
  content: string
  className?: string
}

export const UserMessage = memo(function UserMessage({
  content,
  className,
}: UserMessageProps) {
  const user = useUserStore((state) => state.user)

  return (
    <div className={cn("flex gap-3 justify-end", className)}>
      {/* Message bubble */}
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
      </div>

      {/* Avatar */}
      <AvatarUser
        src={user?.avatar_url}
        name={user?.name}
        size="default"
      />
    </div>
  )
})
