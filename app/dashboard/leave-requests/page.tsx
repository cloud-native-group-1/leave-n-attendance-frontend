import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LeaveRequestsTable } from "@/components/leave-requests-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LeaveRequestsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">請假申請</h1>
          <p className="text-muted-foreground">管理您的請假申請與核准</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/leave-requests/new">
            <Plus className="mr-2 h-4 w-4" />
            新增申請
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>我的請假申請</CardTitle>
          <CardDescription>查看和管理您的請假申請</CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequestsTable type="my-requests" />
        </CardContent>
      </Card>
    </div>
  )
}
