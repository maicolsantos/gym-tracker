"use client"

import { useEffect, useMemo, useState } from "react"
import { Trophy, CalendarDays, ShoppingBag } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fetchFriendWorkouts, fetchFriendProfiles } from "@/lib/friends"
import type { UserProfile, FriendProfile } from "@/lib/friends"
import { MONTHS } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { ShopDialog } from "@/components/shop/shop-dialog"
import { useXp } from "@/hooks/use-xp"

interface RankingEntry {
  profile: FriendProfile
  count: number
  isCurrentUser: boolean
}

function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  return trimmed
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function getOrdinal(position: number): string {
  const ordinals = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"]
  return ordinals[position - 1] ?? `${position}º`
}

interface FriendRankingProps {
  currentUid: string
  friendUids: string[]
  currentUserProfile: UserProfile | null
  currentUserWorkouts: Set<string>
}

function RankingList({
  entries,
  emptyMessage,
}: {
  entries: RankingEntry[]
  emptyMessage: string
}) {
  const maxCount = entries[0]?.count ?? 0
  const hasWorkouts = entries.some((e) => e.count > 0)

  if (!hasWorkouts) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-4">{emptyMessage}</p>
    )
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, idx) => (
        <li
          key={entry.profile.uid}
          className={cn(
            "flex items-center gap-4 p-2 rounded-lg",
            entry.isCurrentUser && "bg-primary/10 border border-primary/20",
          )}
        >
          <span className="text-sm font-bold w-6 text-center text-muted-foreground">
            {getOrdinal(idx + 1)}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={entry.profile.photoURL ?? undefined} alt={entry.profile.displayName} referrerPolicy="no-referrer" />
            <AvatarFallback>{getInitials(entry.profile.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {entry.isCurrentUser ? "Você" : entry.profile.displayName}
            </p>
            <Progress
              value={maxCount > 0 ? (entry.count / maxCount) * 100 : 0}
              className="h-1.5 mt-1"
            />
          </div>
          <span className="text-sm font-bold tabular-nums w-8 text-right">{entry.count}</span>
        </li>
      ))}
    </ol>
  )
}

const PODIUM_SLOTS = [
  { position: 2, emoji: "😢", podiumHeight: "h-14", avatarClass: "h-11 w-11", blockColor: "bg-slate-300 dark:bg-slate-600" },
  { position: 1, emoji: "🎉", podiumHeight: "h-24", avatarClass: "h-16 w-16", blockColor: "bg-amber-400 dark:bg-amber-500" },
  { position: 3, emoji: "😅", podiumHeight: "h-9",  avatarClass: "h-9 w-9",   blockColor: "bg-orange-300 dark:bg-orange-700" },
] as const

function YearPodium({ entries }: { entries: RankingEntry[] }) {
  const hasWorkouts = entries.some((e) => e.count > 0)

  if (!hasWorkouts) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-4">Nenhum treino este ano</p>
    )
  }

  const rest = entries.slice(3)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-center gap-3 pt-2 pb-1">
        {PODIUM_SLOTS.map(({ position, emoji, podiumHeight, avatarClass, blockColor }) => {
          const entry = entries[position - 1] ?? null
          return (
            <div key={position} className="flex flex-col items-center flex-1 min-w-0">
              {entry ? (
                <>
                  <span className="text-lg mb-1">{emoji}</span>
                  <Avatar className={avatarClass}>
                    <AvatarImage src={entry.profile.photoURL ?? undefined} alt={entry.profile.displayName} referrerPolicy="no-referrer" />
                    <AvatarFallback className="text-xs">{getInitials(entry.profile.displayName)}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium mt-1 truncate max-w-full text-center px-1">
                    {entry.isCurrentUser ? "Você" : entry.profile.displayName}
                  </p>
                  <p className={cn(
                    "font-extrabold tabular-nums",
                    position === 1 ? "text-base text-amber-600 dark:text-amber-400" : "text-sm",
                  )}>
                    {entry.count}
                  </p>
                </>
              ) : (
                <div className="flex-1" />
              )}
              <div className={cn(
                "w-full rounded-t-lg mt-2 flex items-center justify-center",
                podiumHeight,
                entry ? blockColor : "bg-muted/50 border-2 border-dashed border-muted-foreground/30",
              )}>
                <span className={cn("text-xs font-bold drop-shadow", entry ? "text-white" : "text-muted-foreground")}>{getOrdinal(position)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {rest.length > 0 && (
        <ol className="space-y-1 border-t pt-3">
          {rest.map((entry, idx) => (
            <li
              key={entry.profile.uid}
              className={cn(
                "flex items-center gap-3 px-2 py-1.5 rounded-lg",
                entry.isCurrentUser && "bg-primary/10 border border-primary/20",
              )}
            >
              <span className="text-sm font-bold w-6 text-center text-muted-foreground">
                {getOrdinal(idx + 4)}
              </span>
              <Avatar className="h-7 w-7">
                <AvatarImage src={entry.profile.photoURL ?? undefined} alt={entry.profile.displayName} referrerPolicy="no-referrer" />
                <AvatarFallback className="text-xs">{getInitials(entry.profile.displayName)}</AvatarFallback>
              </Avatar>
              <p className="flex-1 text-sm font-medium truncate">
                {entry.isCurrentUser ? "Você" : entry.profile.displayName}
              </p>
              <span className="text-sm font-bold tabular-nums">{entry.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
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
  const { xpAvailable } = useXp()

  // Serialize Set to stable string so the effect only re-runs when dates actually change
  const workoutsKey = useMemo(
    () => [...currentUserWorkouts].sort().join(","),
    [currentUserWorkouts],
  )

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`
    const yearPrefix = `${year}-`

    const currentDates = [...currentUserWorkouts]
    const currentUserMonthCount = currentDates.filter((d) => d.startsWith(monthPrefix)).length
    const currentUserYearCount = currentDates.filter((d) => d.startsWith(yearPrefix)).length

    if (friendUids.length === 0) {
      if (currentUserProfile) {
        setMonthEntries([{ profile: currentUserProfile, count: currentUserMonthCount, isCurrentUser: true }])
        setYearEntries([{ profile: currentUserProfile, count: currentUserYearCount, isCurrentUser: true }])
        setAllProfiles(new Map([[currentUid, currentUserProfile]]))
        setAllWorkoutDates(new Map([[currentUid, currentDates]]))
      }
      setLoading(false)
      return
    }

    Promise.all([fetchFriendProfiles(friendUids), fetchFriendWorkouts(friendUids)])
      .then(([profiles, workouts]) => {
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
      .catch((err) => console.error("Erro ao buscar ranking:", err))
      .finally(() => setLoading(false))
  }, [currentUid, friendUids, currentUserProfile, workoutsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-based

  function getMonthTop3(month: number): RankingEntry[] {
    const prefix = `${currentYear}-${String(month + 1).padStart(2, "0")}-`
    const entries: RankingEntry[] = []
    allWorkoutDates.forEach((dates, uid) => {
      const profile = allProfiles.get(uid)
      if (!profile) return
      const count = dates.filter((d) => d.startsWith(prefix)).length
      entries.push({ profile, count, isCurrentUser: uid === currentUid })
    })
    return entries.sort((a, b) => b.count - a.count).slice(0, 3)
  }

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
                onClick={() => setShowHistory(true)}
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

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Histórico {currentYear}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {Array.from({ length: currentMonth + 1 }, (_, i) => currentMonth - i).map((m) => {
              const top3 = getMonthTop3(m)
              const hasWorkouts = top3.some((e) => e.count > 0)
              const maxCount = top3[0]?.count ?? 0
              return (
                <div key={m} className="rounded-xl border bg-muted/30 overflow-hidden">
                  <div className="px-3 py-2 border-b bg-muted/50">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {MONTHS[m]}
                    </p>
                  </div>
                  <div className="px-3 py-2">
                    {!hasWorkouts ? (
                      <p className="text-xs text-muted-foreground italic py-1">Sem treinos</p>
                    ) : (
                      <ol className="space-y-1.5">
                        {top3.filter((e) => e.count > 0).map((entry, idx) => (
                          <li
                            key={entry.profile.uid}
                            className={cn(
                              "flex items-center gap-3 p-1.5 rounded-lg",
                              entry.isCurrentUser && "bg-primary/10 border border-primary/20",
                            )}
                          >
                            <span className="text-xs font-bold w-5 text-center text-muted-foreground">
                              {getOrdinal(idx + 1)}
                            </span>
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={entry.profile.photoURL ?? undefined} alt={entry.profile.displayName} referrerPolicy="no-referrer" />
                              <AvatarFallback className="text-xs">{getInitials(entry.profile.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {entry.isCurrentUser ? "Você" : entry.profile.displayName}
                              </p>
                              <Progress
                                value={maxCount > 0 ? (entry.count / maxCount) * 100 : 0}
                                className="h-1 mt-1"
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums w-6 text-right">{entry.count}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
