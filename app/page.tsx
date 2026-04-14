"use client"

import { Calendar } from "@/components/calendar"
import { Login } from "@/components/login"
import { useAuth } from "@/contexts/auth-context"

export default function Page() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <main className="min-h-dvh bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Calendar />
      </div>
    </main>
  )
}
