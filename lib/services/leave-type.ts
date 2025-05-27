import api from "@/lib/api"

export interface LeaveType {
  id: number
  name: string
  color_code?: string
}

/**
 * Gets all available leave types
 */
export async function getLeaveTypes(): Promise<LeaveType[]> {
  try {
    const response = await api.get<LeaveType[]>("/leave-types")
    return response.data
  } catch (error) {
    console.error("Failed to fetch leave types:", error)
    throw error
  }
} 
