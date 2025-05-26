import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaveRequestsTable } from "@/components/leave-requests-table"

export default function ApprovalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">審核申請</h1>
          <p className="text-muted-foreground">管理與審核請假申請</p>
        </div>
      </div>

      <Tabs defaultValue="pending-approval">
        <TabsList>
          <TabsTrigger value="pending-approval">待我審核</TabsTrigger>
          <TabsTrigger value="team-requests">審核紀錄</TabsTrigger>
        </TabsList>
        <TabsContent value="pending-approval" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>待我審核的申請</CardTitle>
              <CardDescription>等待您核准的請假申請</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveRequestsTable type="pending-approval" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team-requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>審核紀錄</CardTitle>
              <CardDescription>查看下屬的請假申請審核紀錄</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveRequestsTable type="team-requests" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 