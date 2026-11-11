"use client"

import { useEffect, useMemo, useState } from "react"
import { Trophy, CalendarDays, ShoppingBag } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { fetchFriendWorkouts, fetchFriendProfiles } from "@/lib/friends"
import type { UserProfile, FriendProfile } from "@/lib/friends"
import { MONTHS } from "@/lib/date-utils"
import { ShopDialog } from "@/components/shop/shop-dialog"
import { useXp } from "@/hooks/use-xp"
import { RankingList, type RankingEntry } from "@/components/ranking-list"
import { YearPodium } from "@/components/year-podium"
import { RankingHistoryDialog } from "@/components/ranking-history-dialog"

export interface FriendRankingProps {
  currentUid: string
  friendUids: string[]
  currentUserProfile: UserProfile | null
  currentUserWorkouts: Set<string>
}

export function FriendRanking({
  currentUid,
  friendUids,
  currentUserProfile,
  currentUserWorkouts,
}: FriendRankingProps) {
  const [monthEntries, setMonthEntries] = useState<RankingEntry[]>([])
  const [yearEntries, setYearEntries] = useState<RankingEntry[]>([])
  const [allProfiles, setAllProfiles] = useState<Map<string, FriendProfile>>(new Map())
  const [allWorkoutDates, setAllWorkoutDates] = useState<Map<string, string[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [selectedHistoryYear, setSelectedHistoryYear] = useState<number>(() => new Date().getFullYear())
  const { xpAvailable } = useXp()

  // Serialize Set to stable string so the effect only re-runs when dates actually change
  const workoutsKey = useMemo(
    () => [...currentUserWorkouts].sort().join(","),
    [currentUserWorkouts],
  )

  useEffect(() => {
    let isMounted = true

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`
    const yearPrefix = `${year}-`

    const currentDates = [...currentUserWorkouts]
    const currentUserMonthCount = currentDates.filter((d) => d.startsWith(monthPrefix)).length
    const currentUserYearCount = currentDates.filter((d) => d.startsWith(yearPrefix)).length

    if (friendUids.length === 0) {
      if (currentUserProfile && isMounted) {
        setMonthEntries([{ profile: currentUserProfile, count: currentUserMonthCount, isCurrentUser: true }])
        setYearEntries([{ profile: currentUserProfile, count: currentUserYearCount, isCurrentUser: true }])
        setAllProfiles(new Map([[currentUid, currentUserProfile]]))
        setAllWorkoutDates(new Map([[currentUid, currentDates]]))
      }
      if (isMounted) setLoading(false)
      return () => {
        isMounted = false
      }
    }

    Promise.all([fetchFriendProfiles(friendUids), fetchFriendWorkouts(friendUids)])
      .then(([profiles, workouts]) => {
        if (!isMounted) return

        const enrichedProfiles = new Map(profiles)
        const enrichedWorkouts = new Map(workouts)
        if (currentUserProfile) {
          enrichedProfiles.set(currentUid, currentUserProfile)
          enrichedWorkouts.set(currentUid, currentDates)
        }
        setAllProfiles(enrichedProfiles)
        setAllWorkoutDates(enrichedWorkouts)

        const friendMonthEntries: RankingEntry[] = friendUids.flatMap((uid) => {
          const profile = profiles.get(uid)
          if (!profile) return []
          const dates = workouts.get(uid) ?? []
          return [{ profile, count: dates.filter((d) => d.startsWith(monthPrefix)).length, isCurrentUser: false }]
        })

        const friendYearEntries: RankingEntry[] = friendUids.flatMap((uid) => {
          const profile = profiles.get(uid)
          if (!profile) return []
          const dates = workouts.get(uid) ?? []
          return [{ profile, count: dates.filter((d) => d.startsWith(yearPrefix)).length, isCurrentUser: false }]
        })

        const currentEntry = currentUserProfile
          ? [{ profile: currentUserProfile, count: currentUserMonthCount, isCurrentUser: true }]
          : []
        const currentYearEntry = currentUserProfile
          ? [{ profile: currentUserProfile, count: currentUserYearCount, isCurrentUser: true }]
          : []

        setMonthEntries([...currentEntry, ...friendMonthEntries].sort((a, b) => b.count - a.count))
        setYearEntries([...currentYearEntry, ...friendYearEntries].sort((a, b) => b.count - a.count))
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Erro ao buscar ranking:", err)
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [currentUid, friendUids, currentUserProfile, workoutsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-based

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>()
    yearsSet.add(currentYear)
    allWorkoutDates.forEach((dates) => {
      dates.forEach((d) => {
        if (typeof d === "string" && d.length >= 4) {
          const y = Number.parseInt(d.slice(0, 4), 10)
          if (!Number.isNaN(y) && y >= 2000 && y <= 2100) {
            yearsSet.add(y)
          }
        }
      })
    })
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [allWorkoutDates, currentYear])

  const getYearRankingFor = useMemo(() => {
    return (targetYear: number): RankingEntry[] => {
      const prefix = `${targetYear}-`
      const entries: RankingEntry[] = []
      allWorkoutDates.forEach((dates, uid) => {
        const profile = allProfiles.get(uid)
        if (!profile) return
        const count = dates.filter((d) => d.startsWith(prefix)).length
        entries.push({ profile, count, isCurrentUser: uid === currentUid })
      })
      return entries.sort((a, b) => b.count - a.count)
    }
  }, [allWorkoutDates, allProfiles, currentUid])

  const getMonthTop3For = useMemo(() => {
    return (month: number, targetYear: number): RankingEntry[] => {
      const prefix = `${targetYear}-${String(month + 1).padStart(2, "0")}-`
      const entries: RankingEntry[] = []
      allWorkoutDates.forEach((dates, uid) => {
        const profile = allProfiles.get(uid)
        if (!profile) return
        const count = dates.filter((d) => d.startsWith(prefix)).length
        entries.push({ profile, count, isCurrentUser: uid === currentUid })
      })
      return entries.sort((a, b) => b.count - a.count).slice(0, 3)
    }
  }, [allWorkoutDates, allProfiles, currentUid])

  const selectedYearPodiumEntries = useMemo(() => {
    if (selectedHistoryYear >= currentYear) return []
    return getYearRankingFor(selectedHistoryYear)
  }, [selectedHistoryYear, currentYear, getYearRankingFor])

  const selectedYearMonthsData = useMemo(() => {
    const isCurrent = selectedHistoryYear === currentYear
    const indices = isCurrent
      ? Array.from({ length: currentMonth + 1 }, (_, i) => currentMonth - i)
      : Array.from({ length: 12 }, (_, i) => 11 - i)

    const list = indices.map((m) => {
      const top3 = getMonthTop3For(m, selectedHistoryYear)
      const hasWorkouts = top3.some((e) => e.count > 0)
      const maxCount = top3[0]?.count ?? 0
      return { month: m, top3, hasWorkouts, maxCount }
    })

    return isCurrent ? list : list.filter((item) => item.hasWorkouts)
  }, [selectedHistoryYear, currentYear, currentMonth, getMonthTop3For])

  const monthLabel = `${MONTHS[currentMonth]} ${currentYear}`
  const yearLabel = `${currentYear}`

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    )
  }

  const displayName = currentUserProfile?.displayName ?? ""

  return (
    <>
      <div className="space-y-6 py-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{monthLabel}</p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1 text-muted-foreground"
                onClick={() => setShowShop(true)}
              >
                <ShoppingBag className="h-3 w-3" />
                Loja
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1 text-muted-foreground"
                onClick={() => {
                  setSelectedHistoryYear(currentYear)
                  setShowHistory(true)
                }}
              >
                <CalendarDays className="h-3 w-3" />
                Histórico
              </Button>
            </div>
          </div>
          <RankingList entries={monthEntries} emptyMessage="Nenhum treino este mês" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center border-t pt-4">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">{yearLabel}</p>
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <YearPodium entries={yearEntries} />
        </div>
      </div>

      <ShopDialog
        open={showShop}
        onOpenChange={setShowShop}
        currentUid={currentUid}
        currentUserDisplayName={displayName}
        xpAvailable={xpAvailable}
      />

      <RankingHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        availableYears={availableYears}
        selectedHistoryYear={selectedHistoryYear}
        onSelectYear={setSelectedHistoryYear}
        currentYear={currentYear}
        selectedYearPodiumEntries={selectedYearPodiumEntries}
        selectedYearMonthsData={selectedYearMonthsData}
      />
    </>
  )
}
