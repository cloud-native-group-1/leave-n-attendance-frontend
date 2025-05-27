"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCheck, MailOpen, FileText, Hourglass, CheckCircle2, XCircle, UserCheck } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  type Notification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "@/lib/services/notification-service"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

// Skeleton component for a single notification
function NotificationSkeleton() {
  return (
    <div className="px-6 py-5">
      <div className="flex justify-between items-start gap-4 mb-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex justify-between items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  )
}

// Skeleton component for notifications list
function NotificationsListSkeleton() {
  return (
    <div className="divide-y divide-border -mx-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <NotificationSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 100,
    total_pages: 0
  })
  
  // Fetch notifications from API
  useEffect(() => {
    fetchNotifications()
  }, [activeTab])
  
  // Add useEffect to fetch notifications when pagination.page changes
  useEffect(() => {
    fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.page])
  
  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Prepare query parameters based on active tab
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        unread_only: activeTab === "unread"
      }
      
      const response = await getNotifications(params)
      setNotifications(response.notifications)
      setPagination(response.pagination)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to fetch notifications. Please try again later.')
      toast.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "unread") return !notification.is_read
    if (activeTab === "read") return notification.is_read
    return true // "all" tab
  })
  
  // Mark a single notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id)
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      )
      
      toast("通知已標記為已讀", {
        description: "該通知已成功標記為已讀"
      })
    } catch (err) {
      console.error('Error marking notification as read:', err)
      toast.error('無法標記通知為已讀')
    }
  }
  
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      
      toast("所有通知已標記為已讀", {
        description: `${notifications.filter(n => !n.is_read).length} 則通知已標記為已讀`
      })
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      toast.error('無法將所有通知標記為已讀')
    }
  }
  
  // Navigate to detail page
  const navigateToDetailPage = (notification: Notification) => {
    // Mark as read before navigation
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    // Navigate to the detail page
    router.push(`/dashboard/leave-requests/${notification.related_id}`);
  }
  
  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    
    if (diffDay > 0) {
      return diffDay === 1 ? "昨天" : `${diffDay} 天前`
    } else if (diffHour > 0) {
      return `${diffHour} 小時前`
    } else if (diffMin > 0) {
      return `${diffMin} 分鐘前`
    } else {
      return "剛剛"
    }
  }
  
  // Icon for each notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "leave_request":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "pending":
        return <Hourglass className="h-5 w-5 text-amber-500" />
      case "approval":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "rejection":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "proxy":
        return <UserCheck className="h-5 w-5 text-purple-500" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }
  
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">通知</h1>
          <p className="text-muted-foreground">
            查看和管理您的通知
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={handleMarkAllAsRead}
          disabled={loading || !notifications.some(n => !n.is_read)}
          className="sm:w-auto w-full"
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          全部標為已讀
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" disabled={loading}>全部</TabsTrigger>
              <TabsTrigger value="unread" disabled={loading}>
                未讀
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="ml-2 rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="read" disabled={loading}>已讀</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <NotificationsListSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">沒有通知</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {activeTab === "unread" 
                  ? "您沒有未讀的通知。" 
                  : activeTab === "read" 
                    ? "您沒有已讀的通知。"
                    : "您目前沒有任何通知。"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border -mx-6">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-6 py-5 transition-colors ${
                    !notification.is_read 
                      ? "bg-muted/50 hover:bg-muted/70" 
                      : "hover:bg-muted/10"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.related_to)}
                      <h3 className="font-medium leading-tight">{notification.title}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center gap-4">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm"
                      onClick={() => navigateToDetailPage(notification)}
                    >
                      查看詳情
                    </Button>
                    {!notification.is_read && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="hover:bg-background/80"
                      >
                        <MailOpen className="h-4 w-4 mr-2" />
                        標為已讀
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t py-6">
          <div className="text-sm text-muted-foreground">
            顯示 {filteredNotifications.length} 則通知，共 {pagination.total} 則
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (pagination.page > 1) {
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              }}
              disabled={pagination.page <= 1 || loading}
            >
              上一頁
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {pagination.page} / {pagination.total_pages} 頁
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (pagination.page < pagination.total_pages) {
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              }}
              disabled={pagination.page >= pagination.total_pages || loading}
            >
              下一頁
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
