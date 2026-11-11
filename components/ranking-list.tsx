"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import type { FriendProfile } from "@/lib/friends"
import { cn } from "@/lib/utils"

export interface RankingEntry {
  profile: FriendProfile
  count: number
  isCurrentUser: boolean
}

export function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  return trimmed
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function getOrdinal(position: number): string {
  const ordinals = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"]
  return ordinals[position - 1] ?? `${position}º`
}

export interface RankingListProps {
  entries: RankingEntry[]
  emptyMessage: string
}

export function RankingList({ entries, emptyMessage }: RankingListProps) {
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
            <AvatarImage
              src={entry.profile.photoURL ?? undefined}
              alt={entry.profile.displayName}
              referrerPolicy="no-referrer"
            />
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
