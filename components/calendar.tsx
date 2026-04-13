"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Dumbbell, LogOut, Users } from "lucide-react"
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getDb } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { MONTHS, WEEKDAYS, getDaysInMonth, getFirstDayOfMonth, formatDateKey } from "@/lib/date-utils"

export function Calendar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Load from Firestore on mount
  useEffect(() => {
    if (!user) return
    const docRef = doc(getDb(), "workouts", user.uid)
    getDoc(docRef)
      .then((snap) => {
        if (snap.exists()) {
          const dates = snap.data().dates as string[]
          setSelectedDates(new Set(dates))
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar treinos:", err)
      })
  }, [user])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const toggleDate = async (day: number) => {
    if (!user) return
    const dateKey = formatDateKey(currentYear, currentMonth, day)
    const removing = selectedDates.has(dateKey)

    // Optimistic update
    const newSelectedDates = new Set(selectedDates)
    if (removing) {
      newSelectedDates.delete(dateKey)
    } else {
      newSelectedDates.add(dateKey)
    }
    setSelectedDates(newSelectedDates)

    // Atomic Firestore update
    const docRef = doc(getDb(), "workouts", user.uid)
    try {
      await updateDoc(docRef, {
        dates: removing ? arrayRemove(dateKey) : arrayUnion(dateKey),
      })
    } catch {
      // Document may not exist yet
      try {
        await setDoc(docRef, { dates: removing ? [] : [dateKey] })
      } catch (err) {
        console.error("Erro ao salvar treino:", err)
        // Rollback
        setSelectedDates(selectedDates)
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error("Erro ao sair:", err)
    }
  }

  const isSelected = (day: number) => {
    const dateKey = formatDateKey(currentYear, currentMonth, day)
    return selectedDates.has(dateKey)
  }

  // Calculate summary per month
  const getMonthlySummary = () => {
    const summary: { [key: string]: number } = {}

    selectedDates.forEach((dateStr) => {
      const [year, month] = dateStr.split("-")
      const monthKey = `${MONTHS[Number.parseInt(month) - 1]} ${year}`
      summary[monthKey] = (summary[monthKey] || 0) + 1
    })

    return Object.entries(summary).sort((a, b) => {
      const [monthA, yearA] = a[0].split(" ")
      const [monthB, yearB] = b[0].split(" ")
      if (yearA !== yearB) return Number.parseInt(yearA) - Number.parseInt(yearB)
      return MONTHS.indexOf(monthA) - MONTHS.indexOf(monthB)
    })
  }

  const monthlySummary = getMonthlySummary()
  const totalSelected = selectedDates.size

  // Generate calendar grid
  const calendarDays = []

  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-10" />)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const selected = isSelected(day)
    const isToday =
      new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear

    calendarDays.push(
      <button
        key={day}
        onClick={() => toggleDate(day)}
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
          "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          selected && "bg-primary text-primary-foreground hover:bg-primary/90",
          !selected && isToday && "border-2 border-primary",
          !selected && !isToday && "text-foreground",
        )}
      >
        {day}
      </button>,
    )
  }

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar Card */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Tracker Ginásio
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.push("/friends")} title="Amigos">
                <Users className="h-4 w-4" />
              </Button>
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.displayName?.split(" ")[0]}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[160px] text-center font-semibold">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">{calendarDays}</div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Clique em uma data para marcar/desmarcar o treino
          </p>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo de Treinos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total */}
          <div className="p-4 rounded-lg bg-primary text-primary-foreground">
            <p className="text-sm opacity-90">Total de dias treinados</p>
            <p className="text-3xl font-bold">{totalSelected}</p>
          </div>

          {/* Monthly breakdown */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Treinos por mês</h3>
            {monthlySummary.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum treino registrado</p>
            ) : (
              <ul className="space-y-2">
                {monthlySummary.map(([month, count]) => (
                  <li key={month} className="flex items-center justify-between p-2 rounded-md bg-muted">
                    <span className="text-sm font-medium">{month}</span>
                    <span className="text-sm font-bold bg-background px-2 py-1 rounded">
                      {count} {count === 1 ? "treino" : "treinos"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}
