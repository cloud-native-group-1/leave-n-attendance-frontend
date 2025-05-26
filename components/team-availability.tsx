'use client'

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  getTeamMembersOnLeaveToday
} from "@/lib/services/team"
import { LeaveRequestTeamItem } from "@/lib/services/team"

// Skeleton component defined inline
function TeamAvailabilitySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>
      </div>
    </div>
  )
}

function TeamAvailabilityStatsSkeleton() {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div className="flex items-center gap-2">
        <span>出勤:</span> 
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <span>請假:</span>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`skeleton-avail-${i}`} className="h-6 w-16" />
        ))}
      </div>
    </div>
  );
}

export function TeamAvailability() {
  const [onLeaveMembers, setOnLeaveMembers] = useState<LeaveRequestTeamItem[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeamAvailability = async () => {
      try {
        setLoading(true)
        const data = await getTeamMembersOnLeaveToday()
        setOnLeaveMembers(data.onLeaveMembers)
        setTotalMembers(data.totalMembers)
      } catch (err) {
        setError("無法載入團隊資料")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamAvailability()
  }, [])

  if (error) {
    return (
      <div className="text-sm text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  if (loading) {
    return <TeamAvailabilitySkeleton />
  }

  const presentMembers = totalMembers - onLeaveMembers.length
  const attendanceRate = totalMembers > 0 ? (presentMembers / totalMembers) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{presentMembers}</div>
          <div className="text-sm text-muted-foreground">
            <div>今日出勤</div>
            <div>共 {totalMembers} 人</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">
            <div>出勤率</div>
          </div>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">今日請假 ({onLeaveMembers.length} 人)</div>
        {onLeaveMembers.length === 0 ? (
          <div className="text-sm text-muted-foreground">今日無團隊成員請假</div>
        ) : (
          <div className="space-y-2">
            {onLeaveMembers.map((request) => (
              <div key={request.id} className="text-sm">
                {request.user.last_name}{request.user.first_name} - {request.leave_type.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 