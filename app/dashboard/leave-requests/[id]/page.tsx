"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, Clock, Download, FileText, Paperclip, User, Users } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  getLeaveRequestDetail, 
  getLeaveAttachments, 
  approveLeaveRequest, 
  rejectLeaveRequest,
  type LeaveRequestDetail, 
  type LeaveAttachmentResult 
} from "@/lib/services/leave-request"
import { getCurrentUser, type UserProfile } from "@/lib/services/user"
import { getSubordinates, type TeamMember } from "@/lib/services/team"

interface LeaveRequestDetailPageProps {
  params: Promise<{ id: string }>
}

export default function LeaveRequestDetailPage({ params }: LeaveRequestDetailPageProps) {
  const router = useRouter()
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequestDetail | null>(null)
  const [attachments, setAttachments] = useState<LeaveAttachmentResult[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [subordinates, setSubordinates] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)

  // Check if current user can approve this request
  const canApprove = currentUser && leaveRequest && 
    subordinates.some(sub => sub.id === leaveRequest.user.id) &&
    leaveRequest.status === "pending"

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const resolvedParams = await params
        const requestId = parseInt(resolvedParams.id)

        if (isNaN(requestId)) {
          toast.error("無效的請假申請 ID")
          router.push("/dashboard/leave-requests")
          return
        }

        // Fetch all data in parallel
        const [requestDetail, requestAttachments, user] = await Promise.all([
          getLeaveRequestDetail(requestId),
          getLeaveAttachments(requestId),
          getCurrentUser(),
        ])

        setLeaveRequest(requestDetail)
        setAttachments(requestAttachments)
        setCurrentUser(user)

        // Fetch subordinates if user is a manager
        if (user.is_manager) {
          const subs = await getSubordinates()
          setSubordinates(subs)
        }

      } catch (error) {
        console.error("Failed to fetch leave request details:", error)
        toast.error("載入請假申請詳情失敗")
        router.push("/dashboard/leave-requests")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params, router])

  const handleApprove = async () => {
    if (!leaveRequest) return

    try {
      setIsApproving(true)
      const response = await approveLeaveRequest(leaveRequest.id)
      
      // Update local state with the response data
      setLeaveRequest(prev => prev ? { 
        ...prev, 
        status: "approved",
        approver: response.approver,
        approved_at: response.approved_at
      } : null)
      
      toast.success("請假申請已核准")
    } catch (error) {
      console.error("Failed to approve leave request:", error)
      toast.error("核准請假申請失敗")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!leaveRequest || !rejectionReason.trim()) {
      toast.error("請輸入拒絕理由")
      return
    }

    try {
      setIsRejecting(true)
      const response = await rejectLeaveRequest(leaveRequest.id, rejectionReason)
      
      // Update local state with the response data
      setLeaveRequest(prev => prev ? { 
        ...prev, 
        status: "rejected",
        rejection_reason: rejectionReason,
        approver: response.approver,
        approved_at: response.approved_at
      } : null)
      
      toast.success("請假申請已拒絕")
      setShowRejectForm(false)
      setRejectionReason("")
    } catch (error) {
      console.error("Failed to reject leave request:", error)
      toast.error("拒絕請假申請失敗")
    } finally {
      setIsRejecting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge variant="default">已核准</Badge>
      case "rejected":
        return <Badge variant="destructive">已拒絕</Badge>
      case "pending":
        return <Badge variant="outline">審核中</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = (attachment: LeaveAttachmentResult) => {
    // For now, we'll use the file_path from the API response
    // In a real implementation, you might need a dedicated download endpoint
    try {
      const link = document.createElement('a')
      link.href = attachment.file_path
      link.download = attachment.file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download file:', error)
      toast.error('下載檔案失敗')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  if (!leaveRequest) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">找不到請假申請</p>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/leave-requests")}
            className="mt-4"
          >
            返回列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
  
      </div>

      <div className="space-y-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  請假申請詳情
                  
                </CardTitle>
                <Badge variant="outline" className="text-sm">申請編號：{leaveRequest.request_id}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">申請人</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{leaveRequest.user.last_name}{leaveRequest.user.first_name}</span>
                    {leaveRequest.user.employee_id && (
                      <span className="text-sm text-muted-foreground">({leaveRequest.user.employee_id})</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">假別</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{leaveRequest.leave_type.name}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">請假期間</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(leaveRequest.start_date), "yyyy/MM/dd")} - {format(new Date(leaveRequest.end_date), "yyyy/MM/dd")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">請假天數</Label>
                  <span className="font-medium">{leaveRequest.days_count} 天</span>
                </div>

                {leaveRequest.proxy_person && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">代理人</Label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{leaveRequest.proxy_person.last_name}{leaveRequest.proxy_person.first_name}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">申請時間</Label>
                  <span>{format(new Date(leaveRequest.created_at), "yyyy/MM/dd HH:mm")}</span>
                </div>
              </div>

              {leaveRequest.reason && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">請假事由</Label>
                    <p className="text-sm bg-muted p-3 rounded-md">{leaveRequest.reason}</p>
                  </div>
                </>
              )}

              {/* Approval Status Footer */}
              {leaveRequest.status !== "pending" && (
                <>
                  <Separator />
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">審核狀態</Label>
                      {getStatusBadge(leaveRequest.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {leaveRequest.approver && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">審核人</Label>
                          <p className="text-sm">{leaveRequest.approver.last_name}{leaveRequest.approver.first_name}</p>
                        </div>
                      )}

                      {leaveRequest.approved_at && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">審核時間</Label>
                          <p className="text-sm">{format(new Date(leaveRequest.approved_at), "yyyy/MM/dd HH:mm")}</p>
                        </div>
                      )}
                    </div>

                    {leaveRequest.rejection_reason && leaveRequest.status.toLowerCase() === "rejected" && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">拒絕理由</Label>
                        <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20">
                          {leaveRequest.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  附件 ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file_size)} • 
                            上傳於 {format(new Date(attachment.uploaded_at), "yyyy/MM/dd HH:mm")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        className="flex-shrink-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Actions */}
          {canApprove && (
            <Card>
              <CardHeader>
                <CardTitle>審核操作</CardTitle>
                <CardDescription>
                  您可以核准或拒絕此請假申請
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showRejectForm ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="flex-1"
                    >
                      {isApproving ? "核准中..." : "核准申請"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectForm(true)}
                      className="flex-1"
                    >
                      拒絕申請
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">拒絕理由</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="請輸入拒絕理由..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isRejecting || !rejectionReason.trim()}
                        className="flex-1"
                      >
                        {isRejecting ? "拒絕中..." : "確認拒絕"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm(false)
                          setRejectionReason("")
                        }}
                        className="flex-1"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
