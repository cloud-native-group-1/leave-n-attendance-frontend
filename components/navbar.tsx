"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from '@/hooks/use-auth'
import { NotificationsPopover } from "./notifications-popover"

export function Navbar() {
  const router = useRouter()
  const { user, logout, loading: userLoading } = useAuth()

  return (
    <header className="border-b bg-background mb-4" data-testid="navbar">
      <div className="flex h-fit items-center pr-2 md:pr-4 pb-4">
        <SidebarTrigger className="absolute" data-testid="sidebar-trigger" />
        <div className="ml-auto flex items-center gap-4">
          <NotificationsPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
                data-testid="user-menu-button"
              >
                <Avatar>
                  <AvatarImage
                    src="/placeholder.svg?height=40&width=40"
                    alt="User"
                    data-testid="user-avatar"
                  />
                  <AvatarFallback>{user?.first_name || ''}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="end"
              forceMount
              data-testid="user-menu"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {userLoading ? '載入中...' : user ? `${user.last_name}${user.first_name}` : '未登入'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userLoading ? '' : user?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (user) {
                    router.push(`/dashboard/profile/${user.id}`)
                  }
                }}
                data-testid="menu-profile"
              >
                <User className="mr-2 h-4 w-4" />
                <span>個人資料</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                data-testid="menu-settings"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>設定</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => { logout(); router.push("/login") }}
                data-testid="menu-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>登出</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
