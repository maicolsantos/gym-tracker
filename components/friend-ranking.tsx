"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchFriendWorkouts, fetchFriendProfiles } from "@/lib/friends"
import type { UserProfile } from "@/lib/friends"
import { MONTHS } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface RankingEntry {
  profile: UserProfile
  count: number
  isCurrentUser: boolean
}

function getInitials(name: string): string {
  return name
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
            <AvatarImage src={entry.profile.photoURL ?? undefined} alt={entry.profile.displayName} />
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
                    <AvatarImage src={entry.profile.photoURL ?? undefined} alt={entry.profile.displayName} />
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
                entry ? blockColor : "bg-muted/20",
              )}>
                <span className="text-xs font-bold text-white drop-shadow">{getOrdinal(position)}</span>
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
                <AvatarImage src={entry.profile.photoURL ?? undefined} alt={entry.profile.displayName} />
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`
    const yearPrefix = `${year}-`

    const currentUserMonthCount = [...currentUserWorkouts].filter((d) => d.startsWith(monthPrefix)).length
    const currentUserYearCount = [...currentUserWorkouts].filter((d) => d.startsWith(yearPrefix)).length

    if (friendUids.length === 0) {
      if (currentUserProfile) {
        setMonthEntries([{ profile: currentUserProfile, count: currentUserMonthCount, isCurrentUser: true }])
        setYearEntries([{ profile: currentUserProfile, count: currentUserYearCount, isCurrentUser: true }])
      }
      setLoading(false)
      return
    }

    Promise.all([fetchFriendProfiles(friendUids), fetchFriendWorkouts(friendUids)])
      .then(([profiles, workouts]) => {
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
  }, [currentUid, friendUids, currentUserProfile, currentUserWorkouts])

  const now = new Date()
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  const yearLabel = `${now.getFullYear()}`

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

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground text-center">{monthLabel}</p>
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
  )
}
