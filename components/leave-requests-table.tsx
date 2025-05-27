"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Check, Eye, Filter, MoreHorizontal, X, CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn, formatName } from "@/lib/utils"

// Import the filters component
import { LeaveRequestFilters as FiltersComponent, UIFilters } from "@/components/filters/leave-request-filters"

// Import services and types
import { 
  LeaveRequest, 
  LeaveRequestListItem,
  LeaveRequestTeamItem,
  LeaveRequestListResponse, 
  LeaveRequestTeamListResponse,
  PaginationMeta,
  TeamLeaveRequestFilters,
  ProxyUserOut,
  isTeamLeaveRequest,
  getMyLeaveRequests,
  getTeamLeaveRequests,
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
} from "@/lib/services/leave-request"
import { getLeaveTypes, LeaveType } from "@/lib/services/leave-type"
import { ViewRequestDialog } from "@/components/dialogs/view-request-dialog"
import { ApproveRequestDialog } from "@/components/dialogs/approve-request-dialog"
import { RejectRequestDialog } from "@/components/dialogs/reject-request-dialog"

// Define Props type
interface LeaveRequestsTableProps {
  type: "my-requests" | "pending-approval" | "team-requests"
}


export function LeaveRequestsTable({ type }: LeaveRequestsTableProps) {
  const router = useRouter()
  
  // State management
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataInitialized, setDataInitialized] = useState(false)
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    per_page: 100,
    total_pages: 0
  })
  
  // Filter states
  const [filters, setFilters] = useState<UIFilters>({} as UIFilters)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // Request action states
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  
  // API request flags to prevent duplicates
  const [isLeaveTypesFetching, setIsLeaveTypesFetching] = useState(false)
  const [isLeaveRequestsFetching, setIsLeaveRequestsFetching] = useState(false)

  // Fetch leave types only once on mount
  useEffect(() => {
    if (!dataInitialized) {
      fetchLeaveTypes();
      setDataInitialized(true);
    }
  }, [dataInitialized]);

  // Fetch leave requests only when necessary
  useEffect(() => {
    fetchLeaveRequests();
  }, [type, pagination.page]);

  // Fetch leave requests when filters change, but not on initial render
  useEffect(() => {
    if (dataInitialized) {
      fetchLeaveRequests();
    }
  }, [filters, dataInitialized]);

  // Data fetching functions
  const fetchLeaveTypes = async () => {
    if (isLeaveTypesFetching) return;
    
    try {
      setIsLeaveTypesFetching(true);
      const data = await getLeaveTypes();
      setLeaveTypes(data);
    } catch (err) {
      console.error('Error fetching leave types:', err);
      setLeaveTypes([]);
    } finally {
      setIsLeaveTypesFetching(false);
    }
  };

  const fetchLeaveRequests = async () => {
    if (isLeaveRequestsFetching) return;
    
    try {
      setIsLeaveRequestsFetching(true);
      setLoading(true);
      setError(null);
      
      // Convert UI filters to API filters
      const apiFilters: TeamLeaveRequestFilters = {
        status: filters.status === 'all' ? undefined : filters.status,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        page: pagination.page,
        per_page: pagination.per_page,
      };
      
      // Add user_id only if it's defined
      if (filters.user_id) {
        apiFilters.user_id = filters.user_id;
      }
      
      // Add leave_type_id if defined
      if (filters.leave_type_id) {
        apiFilters.leave_type_id = filters.leave_type_id;
      }
      
      // Add employee_id filter for team requests
      if (filters.employee_id && (type === "team-requests" || type === "pending-approval")) {
        apiFilters.employee_id = filters.employee_id;
      }
      
      console.log('API filters:', apiFilters);
      
      let response;
      
      switch (type) {
        case 'my-requests':
          response = await getMyLeaveRequests(apiFilters);
          break;
        case 'pending-approval':
          response = await getPendingLeaveRequests(apiFilters);
          break;
        case 'team-requests':
          response = await getTeamLeaveRequests(apiFilters);
          break;
      }
      
      setLeaveRequests(response.leave_requests);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('無法獲取請假申請資料，請稍後再試。');
      toast.error('無法獲取請假申請資料');
    } finally {
      setLoading(false);
      setIsLeaveRequestsFetching(false);
    }
  };

  // Filter handling functions
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      // Type-safe approach using specific keys
      if (key === 'leave_type_id') {
        if (value === 'all') {
          delete newFilters.leave_type_id;
        } else {
          newFilters.leave_type_id = parseInt(value, 10);
        }
      } else if (key === 'status') {
        if (value === 'all') {
          delete newFilters.status;
        } else {
          newFilters.status = value;
        }
      } else if (key === 'start_date') {
        if (value === '') {
          delete newFilters.start_date;
        } else {
          newFilters.start_date = value;
        }
      } else if (key === 'end_date') {
        if (value === '') {
          delete newFilters.end_date;
        } else {
          newFilters.end_date = value;
        }
      } else if (key === 'employee_id') {
        if (value === 'all' || value === '') {
          delete newFilters.employee_id;
        } else {
          newFilters.employee_id = parseInt(value, 10);
        }
      }
      
      console.log('newFilters', newFilters);
      return newFilters;
    });
    
    // Reset to page 1 when filters change
    setPagination(prevPagination => ({...prevPagination, page: 1}));
  };

  const resetFilters = () => {
    setFilters({} as UIFilters);
    setPagination(prevPagination => ({...prevPagination, page: 1}));
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    if (newPage === pagination.page) return;
    setPagination(prevPagination => ({...prevPagination, page: newPage}));
  };

  // Request action handlers
  const handleView = (request: LeaveRequest) => {
    router.push(`/dashboard/leave-requests/${request.id}`)
  }

  const handleApprove = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsApproveDialogOpen(true);
  }

  const handleReject = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  }

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      await approveLeaveRequest(selectedRequest.id);
      
      toast.success("申請已核准", {
        description: `請假申請 ${selectedRequest.request_id} 已成功核准。`,
      });
      
      fetchLeaveRequests(); // Refresh the data
    } catch (err) {
      console.error('Error approving leave request:', err);
      toast.error('無法核准請假申請');
    }
    
    setIsApproveDialogOpen(false);
  }

  const confirmReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason) {
      toast.error("需要提供拒絕原因", {
        description: "請提供拒絕此申請的原因。",
      });
      return;
    }

    try {
      await rejectLeaveRequest(selectedRequest.id, rejectReason);
      
      toast.success("申請已拒絕", {
        description: `請假申請 ${selectedRequest.request_id} 已成功拒絕。`,
      });
      
      fetchLeaveRequests(); // Refresh the data
    } catch (err) {
      console.error('Error rejecting leave request:', err);
      toast.error('無法拒絕請假申請');
    }
    
    setIsRejectDialogOpen(false);
    setRejectReason("");
  }

  // Loading and error states
  if (loading && leaveRequests.length === 0) {
    return <div className="text-center py-4">載入請假申請中...</div>;
  }
  
  if (error && leaveRequests.length === 0) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <>
      {/* Header with title and filter button */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                篩選
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" side="bottom" className="w-80">
              <FiltersComponent
                type={type}
                filters={filters}
                leaveTypes={leaveTypes}
                onFilterChange={handleFilterChange}
                onResetFilters={resetFilters}
                onClose={() => {
                  setIsFilterOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Request Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>申請編號</TableHead>
            {(type === "pending-approval" || type === "team-requests") && <TableHead>員工</TableHead>}
            <TableHead>假別</TableHead>
            <TableHead>期間</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>代理人</TableHead>
            {type !== "pending-approval" && <TableHead>審核人</TableHead>}
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveRequests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={type === "pending-approval" ? 7 : 8} className="text-center">
                未找到請假申請
              </TableCell>
            </TableRow>
          ) : (
            leaveRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.request_id}</TableCell>
                {(type === "pending-approval" || type === "team-requests") && (
                  <TableCell>
                    {isTeamLeaveRequest(request) ? formatName(request.user) : "您"}
                  </TableCell>
                )}
                <TableCell>{request.leave_type.name}</TableCell>
                <TableCell>
                  {request.start_date} 至 {request.end_date}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>{formatName(request.proxy_person)}</TableCell>
                {type !== "pending-approval" && <TableCell>{formatName(request.approver)}</TableCell>}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">操作</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(request)}>
                        <Eye className="mr-2 h-4 w-4" />
                        查看詳情
                      </DropdownMenuItem>
                      {type === "pending-approval" && request.status.toLowerCase() === "pending" && (
                        <>
                          <DropdownMenuItem onClick={() => handleApprove(request)}>
                            <Check className="mr-2 h-4 w-4" />
                            核准
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(request)}>
                            <X className="mr-2 h-4 w-4" />
                            拒絕
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLeaveRequestsFetching}
          >
            上一頁
          </Button>
          <span>
            第 {pagination.page} 頁，共 {pagination.total_pages} 頁
          </span>
          <Button 
            variant="outline" 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.total_pages || isLeaveRequestsFetching}
          >
            下一頁
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <ViewRequestDialog 
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        request={selectedRequest}
        formatName={formatName}
      />
      
      <ApproveRequestDialog
        isOpen={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        request={selectedRequest}
        formatName={formatName}
        onConfirm={confirmApprove}
      />
      
      <RejectRequestDialog
        isOpen={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        request={selectedRequest}
        formatName={formatName}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        onConfirm={confirmReject}
      />
    </>
  )
}
