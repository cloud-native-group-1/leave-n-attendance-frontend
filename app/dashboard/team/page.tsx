"use client"

import { useState, useEffect } from "react"
import { TeamMember, EmployeeCard } from "@/components/employee-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTeamMembers, getSubordinates } from "@/lib/services/team"
import { getTeamLeaveRequests, LeaveRequestTeamItem, isOnLeave } from "@/lib/services/leave-request"
import { formatDate } from "@/lib/utils"
import { getCurrentUser, UserProfile, ManagerOut } from "@/lib/services/user"

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [subordinates, setSubordinates] = useState<TeamMember[]>([])
  const [manager, setManager] = useState<TeamMember | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestTeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  
  // Helper function to convert API data to our TeamMember format
  const processTeamMember = (
    member: any, 
    leaveData: LeaveRequestTeamItem[], 
    currentUserId: number,
    managerData: ManagerOut | null = null
  ): TeamMember => {
    // Check if the member is currently on leave
    const memberLeaveStatus = isOnLeave(member.id, leaveData)
    
    return {
      id: member.id,
      employee_id: member.employee_id,
      first_name: member.first_name,
      last_name: member.last_name,
      position: member.position,
      email: member.email,
      department: member.department.name,
      status: memberLeaveStatus.isOnLeave ? "請假中" : "在職中",
      leaveType: memberLeaveStatus.leaveType,
      leaveUntil: memberLeaveStatus.endDate,
      isCurrentUser: member.id === currentUserId,
      isManager: managerData && member.id === managerData.id
    } as TeamMember
  }
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch current user profile
        const userProfile = await getCurrentUser()
        setCurrentUser(userProfile)
        
        // Fetch team members (colleagues)
        const teamData = await getTeamMembers()
        
        // Fetch subordinates if user is a manager
        let subordinatesData: any[] = []
        if (userProfile.is_manager) {
          subordinatesData = await getSubordinates()
        }
        
        // Fetch leave requests
        const leaveData = await getTeamLeaveRequests({
          status: 'approved' // Only get approved leave requests
        })
        
        setLeaveRequests(leaveData.leave_requests)
        
        // Set manager if current user has one
        if (userProfile.manager) {
          // Create a TeamMember object for the manager
          console.log(userProfile.manager)
          setManager(processTeamMember({ 
            id: userProfile.manager.id,
            first_name: userProfile.manager.first_name,
            last_name: userProfile.manager.last_name,
            position: userProfile.manager.position,
            email: userProfile.manager.email,
            department: userProfile.manager.department,
            employee_id: ""
          }, leaveData.leave_requests, userProfile.id, userProfile.manager))
        }
        
        // Transform team data to match our component's expected format
        const processedTeamMembers = teamData
          .filter(member => !userProfile.manager || member.id !== userProfile.manager.id) // Filter out manager if exists
          .map(member => processTeamMember(member, leaveData.leave_requests, userProfile.id))
        
        // Process subordinates
        const processedSubordinates = subordinatesData.map(member => 
          processTeamMember(member, leaveData.leave_requests, userProfile.id)
        )
        
        setTeamMembers(processedTeamMembers)
        setSubordinates(processedSubordinates)
        
        // Extract unique departments
        const deptSet = new Set<string>()
        processedTeamMembers.forEach(member => {
          if (member.department) {
            deptSet.add(member.department)
          }
        })
        
        // Add "All" at the beginning of departments list
        setDepartments(['全部', ...Array.from(deptSet)])
      } catch (err) {
        console.error('Error fetching team data:', err)
        setError('無法載入團隊資料，請稍後再試。')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  if (loading) {
    return <div className="flex justify-center items-center h-96">載入團隊資料中...</div>
  }
  
  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">組織架構</h1>
        <p className="text-muted-foreground">查看團隊成員及其目前狀態</p>
      </div>

      {/* Manager Card */}
      {manager && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">主管</h2>
          <div className="max-w-sm mx-auto">
            <EmployeeCard member={manager} />
          </div>
        </div>
      )}

      {/* Colleagues */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">同事</h2>
        <Tabs defaultValue="全部">
          <TabsList className="mb-4">
            {departments.map((dept) => (
              <TabsTrigger key={dept} value={dept}>
                {dept}
              </TabsTrigger>
            ))}
          </TabsList>

          {departments.map((dept) => (
            <TabsContent key={dept} value={dept}>
              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                {teamMembers
                  .filter((member) => dept === "全部" || member.department === dept)
                  .map((member) => (
                    <EmployeeCard key={member.id} member={member} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Subordinates */}
      {subordinates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">下屬</h2>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {subordinates.map((subordinate) => (
              <EmployeeCard key={subordinate.id} member={subordinate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
