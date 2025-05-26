"use client"

import { useState, useEffect } from "react"
import { TeamMember, EmployeeCard } from "@/components/employee-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Tree, TreeNode } from "react-organizational-chart"
import { Mail } from "lucide-react"
import { getTeamMembers, getSubordinates } from "@/lib/services/team"
import { getTeamLeaveRequests, LeaveRequestTeamItem, isOnLeave } from "@/lib/services/leave-request"
import { cn, formatDate } from "@/lib/utils"
import { getCurrentUser, UserProfile, ManagerOut } from "@/lib/services/user"
import { useRouter } from "next/navigation"

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [subordinates, setSubordinates] = useState<TeamMember[]>([])
  const [manager, setManager] = useState<TeamMember | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestTeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const router = useRouter()
  
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

  // Organization chart node component
  const OrgNode = ({ member, isCurrentUser }: { member: TeamMember; isCurrentUser?: boolean }) => (
    <div className={`flex flex-col items-center p-3 border rounded-lg bg-white shadow-sm min-w-[120px] ${
      isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      {/* Status bar */}
      <div className={`w-full h-1 rounded-t-lg mb-2 ${
        member.status === "在職中" ? "bg-green-500" : "bg-amber-500"
      }`} />
      
      <Avatar className="h-12 w-12 mb-2">
        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.last_name}${member.first_name}`} />
        <AvatarFallback>
          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      <div className="text-center w-full">
        <div className="flex items-center justify-center gap-1 mb-1">
          <div className="font-medium text-sm truncate">{member.last_name}{member.first_name}</div>
          {member.isCurrentUser && (
            <Badge variant="secondary" className="text-xs px-1 py-0">本人</Badge>
          )}
        </div>
        
        {member.department && (
          <Badge variant="outline" className="text-xs mb-1 max-w-full truncate">
            {member.department}
          </Badge>
        )}
        
        <div className="text-xs text-gray-500 mb-2 truncate">{member.position}</div>
        
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant={member.status === "在職中" ? "default" : "outline"} 
              className="text-xs mb-2"
            >
              {member.status}
            </Badge>
          </TooltipTrigger>
          {member.status === "請假中" && (
            <TooltipContent>
              <p>{member.leaveType}</p>
              <p>直到 {member.leaveUntil && formatDate(member.leaveUntil)}</p>
            </TooltipContent>
          )}
        </Tooltip>
        <Button 
          size="sm" 
          variant="ghost" 
          className="w-full text-xs h-6 px-2"
          onClick={() => router.push(`/dashboard/profile/${member.id}`)}
        >
          查看資料
        </Button>
      </div>
    </div>
  )
  
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

      {/* Organization Chart */}
      {currentUser && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>組織架構圖</CardTitle>
            <CardDescription>團隊成員的隸屬關係</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="flex justify-center overflow-x-auto">
                <Tree
                  lineWidth="2px"
                  lineColor="#e5e7eb"
                  lineBorderRadius="4px"
                  label={
                    manager ? (
                      <OrgNode member={manager} />
                    ) : (
                      <OrgNode 
                        member={{
                          id: currentUser.id,
                          employee_id: currentUser.employee_id || '',
                          first_name: currentUser.first_name,
                          last_name: currentUser.last_name,
                          position: currentUser.position || '',
                          email: currentUser.email,
                          department: currentUser.department?.name || '',
                          status: "在職中",
                          isCurrentUser: true,
                          isManager: false
                        }}
                        isCurrentUser={true}
                      />
                    )
                  }
                >
                  {/* 如果有主管，顯示當前用戶和同事作為主管的子節點 */}
                  {manager && (
                    <>
                      {/* 當前用戶節點 */}
                      <TreeNode
                        label={
                          <OrgNode 
                            member={{
                              id: currentUser.id,
                              employee_id: currentUser.employee_id || '',
                              first_name: currentUser.first_name,
                              last_name: currentUser.last_name,
                              position: currentUser.position || '',
                              email: currentUser.email,
                              department: currentUser.department?.name || '',
                              status: "在職中",
                              isCurrentUser: true,
                              isManager: false
                            }}
                            isCurrentUser={true}
                          />
                        }
                      >
                        {/* 當前用戶的下屬 */}
                        {subordinates.map((subordinate) => (
                          <TreeNode
                            key={subordinate.id}
                            label={<OrgNode member={subordinate} />}
                          />
                        ))}
                      </TreeNode>
                      
                      {/* 同事節點（限制顯示數量避免過於複雜） */}
                      {teamMembers.map((colleague) => { 
                        if (colleague.id === currentUser.id) {
                          return null;
                        }
                        return <TreeNode
                          key={colleague.id}
                          label={<OrgNode member={colleague} />}
                        />;
                      })}
                    </>
                  )}
                  
                  {/* 如果沒有主管，當前用戶是根節點，只顯示下屬 */}
                  {!manager && subordinates.map((subordinate) => (
                    <TreeNode
                      key={subordinate.id}
                      label={<OrgNode member={subordinate} />}
                    />
                  ))}
                </Tree>
              </div>
              {teamMembers.length > 2 && manager && (
                <div className="text-center text-sm text-gray-500 mt-2">
                  還有 {teamMembers.length - 2} 位同事未顯示在架構圖中
                </div>
              )}
            </TooltipProvider>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
