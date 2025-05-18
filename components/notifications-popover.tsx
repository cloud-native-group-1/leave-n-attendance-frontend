import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, CheckCheck, Clock, FileText, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { 
  type Notification,
  getNotifications,
  markAllNotificationsAsRead
} from "@/lib/services/notification-service"

export function NotificationsPopover() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const response = await getNotifications({ 
          page: 1, 
          per_page: 5,  // Only show latest 5 in navbar
          unread_only: false 
        })
        setNotifications(response.notifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true)
      await markAllNotificationsAsRead()
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      
      toast.success("所有通知已標記為已讀")
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('無法將所有通知標記為已讀')
    } finally {
      setMarkingAllAsRead(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "leave_request":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "team_calendar":
        return <User className="h-5 w-5 text-green-500" />
      case "leave_balance":
        return <FileText className="h-5 w-5 text-amber-500" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          data-testid="notification-button"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
              data-testid="notification-badge"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">通知</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={24}
        sideOffset={12}
        className="w-[30rem] p-0"
        data-testid="notification-popover"
      >
        <div className="flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">通知</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllAsRead || loading}
                  className="h-8"
                  data-testid="mark-all-read-button"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  全部標為已讀
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              您有 {unreadCount} 則未讀通知
            </p>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">載入通知中...</p>
              </div>
            ) : notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 ${
                      !notification.is_read ? "bg-muted/50" : ""
                    }`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="mt-1">{getNotificationIcon(notification.related_to)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium leading-none">{notification.title}</p>
                        {!notification.is_read && (
                          <Badge
                            className="h-1.5 w-1.5 rounded-full p-0"
                            data-testid={`notification-unread-${notification.id}`}
                          />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="p-4 text-center border-t">
                  <Button
                    variant="link"
                    className="w-full"
                    onClick={() => {
                        router.push('/dashboard/notifications')
                        setIsOpen(false)
                    }}
                  >
                    查看所有通知
                  </Button>
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-12 text-center"
                data-testid="no-notifications"
              >
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">已全部處理完畢！</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {"目前沒有任何通知。有新的更新時我們會通知您。"}
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 