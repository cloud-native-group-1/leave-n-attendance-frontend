"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Inter } from "next/font/google"
import type React from "react"
import { useState, useEffect } from "react"
import { Toaster } from "sonner"
import "../globals.css"
import { useAuth } from "@/hooks/use-auth"
const inter = Inter({ subsets: ["latin"] })


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useAuth()
  
  // 管理 sidebar 狀態
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // 從 localStorage 讀取初始狀態
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_state')
    if (savedState !== null) {
      setSidebarOpen(savedState === 'true')
    }
    setIsInitialized(true)
  }, [])

  // 當狀態改變時保存到 localStorage
  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open)
    localStorage.setItem('sidebar_state', open.toString())
  }

  // 等待初始化完成再渲染，避免閃爍
  if (!isInitialized) {
    return null
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className="flex h-screen">
        <div className="flex flex-col flex-1 overflow-hidden">
          <SidebarProvider 
            open={sidebarOpen} 
            onOpenChange={handleSidebarChange}
          >
            <AppSidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <Navbar />
              {children}
            </main>
          </SidebarProvider>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  )
} 