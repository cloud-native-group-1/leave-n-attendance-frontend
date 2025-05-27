'use client'

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  getRecentLeaveRequests, 
  LeaveRequestListResponse,
  type LeaveTypeBasic,
  type ProxyUserOut,
  type LeaveRequestListItem,
  type PaginationMeta
} from "@/lib/services/leave-request"

// Skeleton component defined inline
function RecentLeaveRequestsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={`skeleton-leave-${i}`} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  )
}

export function RecentLeaveRequests() {
  const [data, setData] = useState<LeaveRequestListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentRequests = async () => {
      try {
        setLoading(true)
        const responseData = await getRecentLeaveRequests(100)
        setData(responseData)
      } catch (err) {
        console.error('Failed to fetch recent leave requests:', err)
        setError('無法載入最近的請假紀錄')
      } finally {
        setLoading(false)
      }
    }

    fetchRecentRequests()
  }, [])

  if (error) {
    return (
      <div className="text-sm text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  if (loading) {
    return <RecentLeaveRequestsSkeleton />
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {data.leave_requests.length === 0 ? (
        <div className="text-sm text-muted-foreground">無近期請假申請</div>
      ) : (
        data.leave_requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>
                  {request.proxy_person.first_name[0]}
                  {request.proxy_person.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  [代理人] {request.proxy_person.last_name}{request.proxy_person.first_name} 
                </div>
                <div className="text-sm text-muted-foreground">
                  {request.leave_type.name} • {request.start_date} 至 {request.end_date}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {request.approver ? (
                    <span>審核人: {request.approver.first_name} {request.approver.last_name} • </span>
                  ) : null}
                  <span>申請時間: {new Date(request.created_at).toLocaleDateString('zh-TW')}</span>
                </div>
              </div>
            </div>
            <Badge
              variant={
                request.status.toLowerCase() === "approved"
                  ? "default"
                  : request.status.toLowerCase() === "rejected"
                    ? "destructive"
                    : "outline"
              }
            >
              {request.status.toLowerCase() === "approved" 
                ? "已核准" 
                : request.status.toLowerCase() === "rejected"
                  ? "已拒絕"
                  : request.status.toLowerCase() === "pending"
                    ? "審核中"
                    : request.status}
            </Badge>
          </div>
        ))
      )}
    </div>
  )
} 
