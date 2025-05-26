import api from "@/lib/api"

export interface LeaveTypeBasic {
  id: number
  name: string
}

export interface ProxyUserOut {
  id: number
  first_name: string
  last_name: string
}

export interface LeaveRequestListItem {
  id: number
  request_id: string
  leave_type: LeaveTypeBasic
  start_date: string
  end_date: string
  days_count: number
  reason: string
  status: string
  proxy_person: ProxyUserOut
  approver?: ProxyUserOut | null
  approved_at?: string | null
  created_at: string
  rejection_reason?: string | null
}

export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface LeaveRequestListResponse {
  leave_requests: LeaveRequestListItem[]
  pagination: PaginationMeta
}

export interface LeaveRequestFilters {
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  per_page?: number
}

export interface CreateLeaveRequest {
  leave_type_id: number
  start_date: string
  end_date: string
  reason: string
  proxy_user_id: number
}

// Attachment related interfaces
export interface LeaveAttachmentOut {
  id: number
  leave_request_id: number
  file_name: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export interface LeaveAttachmentResult {
  id: number
  leave_request_id: number
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  uploaded_at: string
}

export interface LeaveAttachmentListResult {
  attachments: LeaveAttachmentResult[]
  total_count: number
}

// Leave request detail interface
export interface UserBase {
  id: number
  first_name: string
  last_name: string
  employee_id?: string | null
}

export interface LeaveTypeBase {
  id: number
  name: string
}

export interface LeaveRequestDetail {
  id: number
  request_id: string
  user: UserBase
  leave_type: LeaveTypeBase
  start_date: string
  end_date: string
  days_count: number
  reason: string
  status: string
  proxy_person: UserBase | null
  approver: UserBase | null
  approved_at: string | null
  created_at: string
  rejection_reason?: string | null
}

export function isOnLeave(userId: number, leaveRequests: LeaveRequestTeamItem[]): { 
  isOnLeave: boolean; 
  leaveType?: string; 
  endDate?: string; 
} {
  const today = new Date()
  const currentLeave = leaveRequests.find(request => {
    if (request.user.id !== userId || request.status !== 'approved') return false
    const startDate = new Date(request.start_date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(request.end_date)
    endDate.setHours(23, 59, 59, 999)
    return today >= startDate && today <= endDate
  })
  console.log('currentLeave', currentLeave)
  console.log('leaveRequests', leaveRequests)
  console.log('today', today)


  return currentLeave 
    ? { 
        isOnLeave: true, 
        leaveType: currentLeave.leave_type.name,
        endDate: currentLeave.end_date 
      }
    : { isOnLeave: false }
} 

export async function getMyLeaveRequests(filters: LeaveRequestFilters = {}): Promise<LeaveRequestListResponse> {
  try {
    const response = await api.get<LeaveRequestListResponse>("/leave-requests", { 
      params: filters 
    })
    return response.data
  } catch (error) {
    console.error("Failed to fetch my leave requests:", error)
    throw error
  }
}

export async function getRecentLeaveRequests(limit: number = 3): Promise<LeaveRequestListResponse> {
  return getMyLeaveRequests({ per_page: limit })
}

export interface TeamLeaveRequestFilters extends LeaveRequestFilters {
  user_id?: number
  leave_type_id?: number
  employee_id?: number
}

export interface LeaveRequestTeamItem extends LeaveRequestListItem {
  user: ProxyUserOut
}

export interface LeaveRequestTeamListResponse {
  leave_requests: LeaveRequestTeamItem[]
  pagination: PaginationMeta
}

export async function getTeamLeaveRequests(filters: TeamLeaveRequestFilters = {}): Promise<LeaveRequestTeamListResponse> {
  try {
    const response = await api.get<LeaveRequestTeamListResponse>("/leave-requests/team", { 
      params: filters 
    })
    return response.data
  } catch (error) {
    console.error("Failed to fetch team leave requests:", error)
    throw error
  }
}

export async function getPendingLeaveRequests(filters: TeamLeaveRequestFilters = {}): Promise<LeaveRequestTeamListResponse> {
  // For pending approval, always set status to pending
  const pendingFilters = { ...filters, status: 'pending' }
  
  try {
    const response = await api.get<LeaveRequestTeamListResponse>("/leave-requests/team", { 
      params: pendingFilters 
    })
    return response.data
  } catch (error) {
    console.error("Failed to fetch pending leave requests:", error)
    throw error
  }
}

export async function approveLeaveRequest(id: number): Promise<LeaveRequestApprovalResponse> {
  try {
    const response = await api.patch<LeaveRequestApprovalResponse>(`/leave-requests/${id}/approve`)
    return response.data
  } catch (error) {
    console.error(`Failed to approve leave request with ID ${id}:`, error)
    throw error
  }
}

export async function rejectLeaveRequest(id: number, rejectionReason: string): Promise<LeaveRequestRejectionResponse> {
  try {
    const response = await api.patch<LeaveRequestRejectionResponse>(
      `/leave-requests/${id}/reject`,
      { rejection_reason: rejectionReason }
    )
    return response.data
  } catch (error) {
    console.error(`Failed to reject leave request with ID ${id}:`, error)
    throw error
  }
}

export type LeaveRequest = LeaveRequestListItem | LeaveRequestTeamItem

export function isTeamLeaveRequest(request: LeaveRequest): request is LeaveRequestTeamItem {
  return 'user' in request
}

export async function createLeaveRequest(data: CreateLeaveRequest) {
  try {
    const response = await api.post("/leave-requests", data)
    return response.data
  } catch (error) {
    console.error("Failed to create leave request:", error)
    throw error
  }
}

export async function getLeaveRequestById(id: number): Promise<LeaveRequestListItem> {
  try {
    const response = await api.get<LeaveRequestListItem>(`/leave-requests/${id}`)
    return response.data
  } catch (error) {
    console.error(`Failed to fetch leave request with ID ${id}:`, error)
    throw error
  }
}

// Attachment functions
export async function uploadLeaveAttachment(leaveRequestId: number, file: File): Promise<LeaveAttachmentOut> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<LeaveAttachmentOut>(
      `/leave-requests/${leaveRequestId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  } catch (error) {
    console.error(`Failed to upload attachment for leave request ${leaveRequestId}:`, error)
    throw error
  }
}

export async function getLeaveAttachments(leaveRequestId: number): Promise<LeaveAttachmentResult[]> {
  try {
    const response = await api.get<LeaveAttachmentListResult>(`/leave-requests/${leaveRequestId}/attachments`)
    return response.data.attachments || []
  } catch (error) {
    console.error(`Failed to fetch attachments for leave request ${leaveRequestId}:`, error)
    throw error
  }
}

export async function getLeaveRequestDetail(id: number): Promise<LeaveRequestDetail> {
  try {
    const response = await api.get<LeaveRequestDetail>(`/leave-requests/${id}`)
    return response.data
  } catch (error) {
    console.error(`Failed to fetch leave request detail with ID ${id}:`, error)
    throw error
  }
}

// Approval related interfaces
export interface LeaveRequestApprovalResponse {
  id: number
  request_id: string
  status: string
  approver: ProxyUserOut
  approved_at: string
}

export interface LeaveRequestRejectionResponse {
  id: number
  request_id: string
  status: string
  approver: ProxyUserOut
  approved_at: string
  rejection_reason: string
} 