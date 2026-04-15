"use client"

import { useEffect } from "react"
import { Calendar } from "@/components/calendar"
import { Login } from "@/components/login"
import { useAuth } from "@/contexts/auth-context"
import { closeMonthIfNeeded } from "@/lib/monthly-ranking"
import { migrateCurrentMonthXp } from "@/lib/xp"

export default function Page() {
  const { user, loading } = useAuth()

  // On app start: close previous month + migrate current month's existing workouts (both idempotent)
  useEffect(() => {
    if (!user) return
    closeMonthIfNeeded(user.uid, user.displayName ?? "Utilizador").catch((err) =>
      console.error("Erro ao fechar mês:", err),
    )
    migrateCurrentMonthXp(user.uid).catch((err) =>
      console.error("Erro ao migrar XP do mês corrente:", err),
    )
  }, [user])

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
