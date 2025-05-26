import api from '../api'

export interface DepartmentOut {
  id: number
  name: string
}

export interface ManagerOut {
  id: number
  first_name: string
  last_name: string
  email: string
  department: DepartmentOut
  position: string
}

export interface UserProfile {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  email: string
  department: DepartmentOut
  position: string
  is_manager: boolean
  manager: ManagerOut | null
  hire_date: string
}

/**
 * Get the current user profile
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await api.get('/users/me')
  return response.data
} 