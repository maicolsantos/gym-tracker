"use client"

import { useEffect, useState } from "react"
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

export function FriendRanking({
  currentUid,
  friendUids,
  currentUserProfile,
  currentUserWorkouts,
}: FriendRankingProps) {
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`

    const currentUserCount = [...currentUserWorkouts].filter((d) => d.startsWith(monthPrefix)).length

    if (friendUids.length === 0) {
      if (currentUserProfile) {
        setEntries([
          {
            profile: currentUserProfile,
            count: currentUserCount,
            isCurrentUser: true,
          },
        ])
      }
      setLoading(false)
      return
    }

    Promise.all([fetchFriendProfiles(friendUids), fetchFriendWorkouts(friendUids)])
      .then(([profiles, workouts]) => {
        const friendEntries: RankingEntry[] = friendUids.flatMap((uid) => {
          const profile = profiles.get(uid)
          if (!profile) return []
          const dates = workouts.get(uid) ?? []
          const count = dates.filter((d) => d.startsWith(monthPrefix)).length
          return [{ profile, count, isCurrentUser: false }]
        })

        const allEntries: RankingEntry[] = [
          ...(currentUserProfile
            ? [{ profile: currentUserProfile, count: currentUserCount, isCurrentUser: true }]
            : []),
          ...friendEntries,
        ].sort((a, b) => b.count - a.count)

        setEntries(allEntries)
      })
      .catch((err) => console.error("Erro ao buscar ranking:", err))
      .finally(() => setLoading(false))
  }, [currentUid, friendUids, currentUserProfile, currentUserWorkouts])

  const now = new Date()
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  const maxCount = entries[0]?.count ?? 0

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

  const hasWorkouts = entries.some((e) => e.count > 0)

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs text-muted-foreground text-center">{monthLabel}</p>
      {!hasWorkouts ? (
        <p className="text-sm text-muted-foreground italic text-center py-4">
          Nenhum amigo treinou este mês
        </p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry, idx) => (
            <li
              key={entry.profile.uid}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg",
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
      )}
    </div>
  )
}
