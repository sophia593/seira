"use client"

import { useRouter } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/stores/user-store"
import { toast } from "@/components/ui/sonner"
import { AvatarUser } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  isCollapsed?: boolean
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const reset = useUserStore((state) => state.reset)

  async function handleLogout() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error("couldn't log out")
      return
    }

    reset()
    router.push("/login")
    toast.success("logged out")
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            isCollapsed
              ? "h-11 w-11 p-0"
              : "h-auto w-full justify-start gap-3 px-2 py-2"
          }
        >
          <AvatarUser
            src={user.avatar_url}
            name={user.name}
            size={isCollapsed ? "default" : "sm"}
          />
          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name || "User"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
