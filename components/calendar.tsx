"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronLeft, ChevronRight, ChevronDown, Dumbbell, Zap } from "lucide-react"
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getDb } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { MONTHS, WEEKDAYS, getDaysInMonth, getFirstDayOfMonth, formatDateKey } from "@/lib/date-utils"
import { awardWorkoutXp, reverseWorkoutXp } from "@/lib/xp"
import { useXp } from "@/hooks/use-xp"
import { XP_WORKOUT } from "@/lib/xp-config"

interface XpFlash {
  amount: number
  id: number
}

interface MonthCount {
  monthName: string
  monthIndex: number
  count: number
}

interface YearSummary {
  year: number
  totalWorkouts: number
  months: MonthCount[]
}

export function Calendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [xpFlash, setXpFlash] = useState<XpFlash | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { xpAvailable } = useXp()

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Load from Firestore on mount with unmount cancellation
  useEffect(() => {
    if (!user) return
    let isMounted = true
    const docRef = doc(getDb(), "workouts", user.uid)
    getDoc(docRef)
      .then((snap) => {
        if (isMounted && snap.exists()) {
          const dates = snap.data().dates as string[]
          setSelectedDates(new Set(dates))
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Erro ao carregar treinos:", err)
        }
      })
    return () => {
      isMounted = false
    }
  }, [user])

  // Cleanup XP flash timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current)
      }
    }
  }, [])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const triggerXpFlash = (amount: number) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    setXpFlash({ amount, id: Date.now() })
    flashTimerRef.current = setTimeout(() => setXpFlash(null), 1000)
  }

  const toggleDate = async (day: number) => {
    if (!user) return
    const dateKey = formatDateKey(currentYear, currentMonth, day)
    const removing = selectedDates.has(dateKey)

    // Snapshot before optimistic update — used for rollback
    const snapshot = new Set(selectedDates)

    // Optimistic update
    setSelectedDates((prev) => {
      const next = new Set(prev)
      if (removing) next.delete(dateKey)
      else next.add(dateKey)
      return next
    })

    // Show XP flash immediately (optimistic)
    triggerXpFlash(removing ? -XP_WORKOUT : XP_WORKOUT)

    // Atomic Firestore update
    const docRef = doc(getDb(), "workouts", user.uid)
    try {
      await updateDoc(docRef, {
        dates: removing ? arrayRemove(dateKey) : arrayUnion(dateKey),
      })
    } catch {
      // Document may not exist yet
      try {
        await setDoc(docRef, { dates: removing ? [] : [dateKey] }, { merge: true })
      } catch (err) {
        console.error("Erro ao salvar treino:", err)
        // Rollback to pre-optimistic snapshot
        setSelectedDates(snapshot)
        return
      }
    }

    // Award / reverse XP after workout write succeeds (fire-and-forget)
    const xpFn = removing ? reverseWorkoutXp : awardWorkoutXp
    xpFn(user.uid, dateKey).catch((err) => console.error("Erro ao atualizar XP:", err))
  }

  const isSelected = (day: number) => {
    const dateKey = formatDateKey(currentYear, currentMonth, day)
    return selectedDates.has(dateKey)
  }

  const todayYear = new Date().getFullYear()

  // Partition workouts into current year and previous/other years
  const { currentYearData, previousYearsData } = useMemo(() => {
    const yearMap = new Map<number, Map<number, number>>()

    selectedDates.forEach((dateStr) => {
      const parts = dateStr.split("-")
      if (parts.length < 2) return
      const y = Number.parseInt(parts[0], 10)
      const m = Number.parseInt(parts[1], 10) - 1
      if (Number.isNaN(y) || Number.isNaN(m) || m < 0 || m > 11) return

      if (!yearMap.has(y)) {
        yearMap.set(y, new Map())
      }
      const months = yearMap.get(y)!
      months.set(m, (months.get(m) || 0) + 1)
    })

    const formatMonths = (monthsMap: Map<number, number>, year: number): MonthCount[] => {
      return Array.from(monthsMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([monthIndex, count]) => ({
          monthName: `${MONTHS[monthIndex]} ${year}`,
          monthIndex,
          count,
        }))
    }

    const currentMonthsMap = yearMap.get(todayYear) || new Map<number, number>()
    const currentMonths = formatMonths(currentMonthsMap, todayYear)
    const currentYearData: YearSummary = {
      year: todayYear,
      totalWorkouts: currentMonths.reduce((acc, m) => acc + m.count, 0),
      months: currentMonths,
    }

    const previousYearsData: YearSummary[] = Array.from(yearMap.entries())
      .filter(([y]) => y !== todayYear)
      .sort(([y1], [y2]) => y2 - y1)
      .map(([year, monthsMap]) => {
        const months = formatMonths(monthsMap, year)
        return {
          year,
          totalWorkouts: months.reduce((acc, m) => acc + m.count, 0),
          months,
        }
      })

    return { currentYearData, previousYearsData }
  }, [selectedDates, todayYear])

  const hasFutureYears = previousYearsData.some((y) => y.year > todayYear)
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
          <CardTitle className="flex items-center gap-2 mb-4">
            <Dumbbell className="h-5 w-5" />
            Tracker Ginásio
          </CardTitle>
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
          {/* Total do ano atual */}
          <div className="p-4 rounded-lg bg-primary text-primary-foreground">
            <p className="text-sm opacity-90">Total de dias treinados em {todayYear}</p>
            <p className="text-3xl font-bold">{currentYearData.totalWorkouts}</p>
          </div>

          {/* XP disponível */}
          <div className="relative p-3 rounded-lg bg-muted flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
              <span className="text-sm font-medium">XP disponível</span>
            </div>
            <div className="flex items-center gap-2">
              {xpFlash && (
                <span
                  key={xpFlash.id}
                  className={cn(
                    "text-xs font-bold tabular-nums animate-xp-float",
                    xpFlash.amount > 0 ? "text-green-500" : "text-red-500",
                  )}
                >
                  {xpFlash.amount > 0 ? "+" : ""}{xpFlash.amount} XP
                </span>
              )}
              <span className="text-base font-bold tabular-nums">
                {xpAvailable.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Monthly breakdown for current year */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Treinos em {todayYear}
            </h3>
            {currentYearData.months.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhum treino registrado em {todayYear} ainda
              </p>
            ) : (
              <ul className="space-y-2">
                {currentYearData.months.map((m) => (
                  <li
                    key={m.monthIndex}
                    className="flex items-center justify-between p-2 rounded-md bg-muted"
                  >
                    <span className="text-sm font-medium">{m.monthName}</span>
                    <span className="text-sm font-bold bg-background px-2 py-1 rounded">
                      {m.count} {m.count === 1 ? "treino" : "treinos"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Previous years collapsible section */}
          {previousYearsData.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 my-4">
                <Separator className="flex-1" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                  {hasFutureYears ? "Outros Anos" : "Anos Anteriores"}
                </span>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-2">
                {previousYearsData.map((yearData) => (
                  <PreviousYearItem key={yearData.year} yearData={yearData} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  )
}

function PreviousYearItem({ yearData }: { yearData: YearSummary }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between p-2.5 rounded-lg bg-muted/60 hover:bg-muted transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
                isOpen && "rotate-180",
              )}
            />
            <span className="text-sm font-semibold">{yearData.year}</span>
          </div>
          <span className="text-xs font-semibold bg-background px-2 py-1 rounded border border-border/40">
            {yearData.totalWorkouts} {yearData.totalWorkouts === 1 ? "treino" : "treinos"}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1">
        <ul className="space-y-1.5 pl-3 border-l-2 border-border/50 ml-3 py-1">
          {yearData.months.map((m) => (
            <li
              key={m.monthIndex}
              className="flex items-center justify-between p-2 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors"
            >
              <span className="text-sm font-medium text-muted-foreground">{m.monthName}</span>
              <span className="text-sm font-bold bg-background text-foreground px-2 py-1 rounded">
                {m.count} {m.count === 1 ? "treino" : "treinos"}
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
