"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import api from '@/lib/api'

interface Department {
  id: number
  name: string
}

interface Manager {
  id: number
  first_name: string
  last_name: string
  email: string
  department: Department
  position: string
}

interface User {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  email: string
  department: Department
  position: string
  is_manager: boolean
  manager?: Manager | null
  hire_date: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // 取得 access_token
  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

  // 取得當前使用者資訊
  const fetchUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      console.log('開始獲取用戶資訊')
      console.log('使用的 Token:', token)
      
      // 嘗試輸出完整請求
      console.log('即將發送請求:', {
        url: '/users/me',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      const res = await api.get('/users/me')
      console.log('獲取用戶資訊成功:', res.data)
      setUser(res.data)
      setError(null)
    } catch (err: any) {
      console.error('獲取用戶資訊失敗:', err)
      console.error('錯誤詳情:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      })
      
      // 若是 401/403 錯誤，表示 token 無效或已過期，應該清除並重定向到登入頁面
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Token 無效或已過期，即將清除')
        localStorage.removeItem('access_token')
      }
      
      setUser(null)
      setError('驗證失敗，請重新登入')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // 登入
  const login = async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      console.log('嘗試登入:', { username })
      
      // 使用 JSON 格式作為請求 body
      const data = { username, password }
      
      // 先輸出請求詳情供調試
      console.log('登入請求詳情:', { 
        url: '/auth/login',
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(data) 
      })
      console.log('data:', data)
      
      const res = await api.post('/auth/login', data)
      
      console.log('登入成功，回應:', res.data)
      
      // 檢查回應格式是否正確
      if (!res.data.access_token) {
        console.error('登入回應中沒有 access_token:', res.data)
        setError('伺服器回應格式錯誤')
        return false
      }
      
      // 儲存 token
      const token = res.data.access_token
      localStorage.setItem('access_token', token)
      console.log('Token 已儲存:', token.substring(0, 15) + '...')
      
      // 小延遲確保 token 已正確保存
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 獲取用戶資訊
      await fetchUser()
      return true
    } catch (err: any) {
      console.error('登入失敗:', err)
      console.error('錯誤詳情:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      })
      
      // 根據錯誤類型顯示更具體的錯誤訊息
      if (err.response?.status === 401) {
        setError('帳號或密碼錯誤')
      } else if (err.response?.status === 400) {
        setError(`格式錯誤: ${err.response.data?.detail || '請檢查輸入'}`)
      } else if (!navigator.onLine) {
        setError('網路連線中斷，請檢查網路設定')
      } else {
        setError('登入失敗，請稍後再試')
      }
      
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }

  // 登出
  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  // 直接在 hook 中使用 useEffect 進行路由保護
  useEffect(() => {
    // 登入頁面不需要驗證
    if (pathname === '/login') return
    
    const token = getToken()
    // 如果未登入且不在登入頁面，則導向登入頁
    // 檢查 token 不存在或已完成載入但用戶資訊不存在
    if ((!token || (!loading && !user)) && pathname !== '/login') {
      console.log('未驗證用戶，重定向到登入頁面')
      router.replace('/login')
    }
  }, [pathname, router, loading, user])

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    fetchUser
  }
} 