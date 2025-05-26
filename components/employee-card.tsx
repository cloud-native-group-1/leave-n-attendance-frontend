import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Mail } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"

export interface TeamMember {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  position: string
  email: string
  department?: string
  status: "在職中" | "請假中"
  leaveType?: string
  leaveUntil?: string
  isCurrentUser?: boolean
  isManager?: boolean
}

interface EmployeeCardProps {
  member: TeamMember
}

export function EmployeeCard({ member }: EmployeeCardProps) {
  const router = useRouter()
  
  return (
    <Card className="max-w-[20rem] flex flex-col overflow-hidden justify-between h-[360px]">
      <CardContent className="p-0 flex-1">
        <div className={`h-2 ${member.status === "在職中" ? "bg-green-500" : "bg-amber-500"}`} />
        <div className="flex flex-col items-center text-center p-6 h-full">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={`/placeholder.svg?height=100&width=100&text=${member.first_name[0]}${member.last_name[0]}`} alt={`${member.first_name} ${member.last_name}`} />
            <AvatarFallback>
                {member.first_name}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{member.last_name}{member.first_name}</h3>
            {member.isCurrentUser && (
              <Badge variant="secondary">本人</Badge>
            )}
            {member.isManager && (
              <Badge variant="outline" className="bg-blue-100 border-blue-200">主管</Badge>
            )}
          </div>
        <div className="flex flex-col items-center justify-center gap-2 text-sm mb-2">
            {
                member.department && (
                <Badge variant="outline" className="rounded-sm">
                    {member.department}
                </Badge>
                )
            }
            <p className="text-sm text-muted-foreground">{member.position}</p>
        </div>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant={member.status === "在職中" ? "default" : "outline"} className="mb-4">
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

          <div className="flex flex-col gap-2 w-full mt-auto">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{member.email}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="w-full bg-muted/50 px-6 py-3 flex justify-center">
        <Button 
          className="w-full" 
          variant="ghost" 
          size="sm"
          onClick={() => router.push(`/dashboard/profile/${member.id}`)}
        >
          查看個人資料
        </Button>
      </CardFooter>
    </Card>
  )
} 