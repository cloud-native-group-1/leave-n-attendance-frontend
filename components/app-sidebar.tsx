import { Bell, Calendar, ClipboardCheck, ClipboardList, Home, PieChart, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useReducer } from "react"

// Skeleton component for loading state
function SidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Skeleton menu items */}
              {Array.from({ length: 6 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton>
                    <div className="flex items-center space-x-3 w-full">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function AppSidebar() {
  const { user, loading: userLoading } = useAuth()
  
  if (userLoading || !user) {
    return <SidebarSkeleton />;
  }
  
  let items = [
    { title: "儀表板", url: "/dashboard", icon: Home },
    { title: "請假申請", url: "/dashboard/leave-requests", icon: ClipboardList },
    { title: "審核申請", url: "/dashboard/approvals", icon: ClipboardCheck },
    { title: "行事曆", url: "/dashboard/calendar", icon: Calendar },
    { title: "團隊", url: "/dashboard/team", icon: Users },
    { title: "通知", url: "/dashboard/notifications", icon: Bell },
  ]
  if (!user.is_manager) {
    items = items.filter((item) => item.title !== "審核申請")
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>請假與考勤系統</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
