'use client'

import { useAuth } from "@/hooks/use-auth"
import { LeaveBalanceProgressLegacy } from "@/components/leave-balance-progress"
import { RecentLeaveRequests } from "@/components/recent-leave-requests"
import { TeamAvailability } from "@/components/team-availability"
import { UpcomingHolidays } from "@/components/upcoming-holidays"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">儀表板</h1>
        <p className="text-muted-foreground">
          {"歡迎回來！以下是您的請假狀態和團隊出勤概況。"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>請假餘額</CardTitle>
            <CardDescription>您本年度的剩餘請假天數</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveBalanceProgressLegacy />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>團隊出勤</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamAvailability />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>近期請假申請</CardTitle>
            <CardDescription>您最近的請假申請及其狀態</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentLeaveRequests />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>近期假日</CardTitle>
            <CardDescription>即將到來的公休假日</CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingHolidays />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 