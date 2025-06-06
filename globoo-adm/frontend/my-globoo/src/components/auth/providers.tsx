"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/layout/sidebar/sidebar"
import { useRouter, usePathname } from "next/navigation"
import { validateTokenClient } from "@/lib/cookieClient/cookieClient"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarState, setSidebarState] = useState<"open" | "closed" | "hidden">("open")
  const router = useRouter()
  const pathname = usePathname()
  
  const isLoginPage = pathname === "/auth/login"
  
  useEffect(() => {
    if (isLoginPage) return
    
    async function checkAuth() {
      try {
        const tokenValid = await validateTokenClient()
        
        if (!tokenValid) {
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/auth/login")
      }
    }
    
    checkAuth()
  }, [router, isLoginPage, pathname])

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar com props corretas */}
      <Sidebar 
        state={sidebarState}
        onStateChange={setSidebarState} 
      />
      
      {/* Conteúdo principal com classes dinâmicas baseadas no estado do sidebar */}
      <main className={`flex-grow transition-all duration-300 ease-in-out ${
        sidebarState === "open" ? "ml-64" : // 16rem = 64
        sidebarState === "closed" ? "ml-18" : // 4.5rem = 18
        "ml-0" // hidden - sidebar completamente escondida
      }`}>        
        <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          {children}
        </div>
      </main>
    </div>
  )
}