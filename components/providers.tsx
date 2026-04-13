"use client"

import { useEffect, type ReactNode } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { initAnalytics } from "@/lib/firebase"

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return <AuthProvider>{children}</AuthProvider>
}
