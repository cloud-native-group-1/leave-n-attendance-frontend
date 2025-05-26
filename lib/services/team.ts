import api from "@/lib/api";

// 團隊成員響應類型
export interface TeamMember {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  email: string;
  department: {
    id: number;
    name: string;
  };
}

export interface TeamListResponse {
  team_members: TeamMember[];
}

// 休假申請類型
export interface LeaveTypeBasic {
  id: number;
  name: string;
}

export interface ProxyUserOut {
  id: number;
  first_name: string;
  last_name: string;
}

export interface LeaveRequestTeamItem {
  id: number;
  request_id: string;
  leave_type: LeaveTypeBasic;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: string;
  proxy_person: ProxyUserOut;
  approver: ProxyUserOut | null;
  approved_at: string | null;
  created_at: string;
  rejection_reason: string | null;
  user: ProxyUserOut;
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface LeaveRequestTeamListResponse {
  leave_requests: LeaveRequestTeamItem[];
  pagination: PaginationMeta;
}

// 獲取團隊成員
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const response = await api.get("/users/team");

    const data: TeamListResponse = response.data;
    return data.team_members;
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

// 獲取下屬成員
export async function getSubordinates(): Promise<TeamMember[]> {
  try {
    const response = await api.get("/users/subordinates");
    
    const data: TeamListResponse = response.data;
    return data.team_members;
  } catch (error) {
    console.error("Error fetching subordinates:", error);
    return [];
  }
}

// 獲取團隊休假申請，如果提供日期則過濾特定日期的申請
export async function getTeamLeaveRequests(date?: string): Promise<LeaveRequestTeamItem[]> {
  try {
    let url = `/leave-requests/team`;
    
    if (date) {
      url += `?start_date=${date}&end_date=${date}`;
    }
    
    const response = await api.get(url);

    const data: LeaveRequestTeamListResponse = response.data;
    return data.leave_requests.filter(req => req.status === "approved");
  } catch (error) {
    console.error("Error fetching team leave requests:", error);
    return [];
  }
}

// 獲取今天休假的團隊成員
export async function getTeamMembersOnLeaveToday(): Promise<{
  totalMembers: number,
  onLeaveMembers: LeaveRequestTeamItem[]
}> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
    const teamMembers = await getTeamMembers();
    const leaveRequests = await getTeamLeaveRequests(today);
    
    return {
      totalMembers: teamMembers.length,
      onLeaveMembers: leaveRequests
    };
  } catch (error) {
    console.error("Error getting team members on leave:", error);
    return {
      totalMembers: 0,
      onLeaveMembers: []
    };
  }
} 