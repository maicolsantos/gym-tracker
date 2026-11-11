"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, getOrdinal, type RankingEntry } from "@/components/ranking-list"
import { cn } from "@/lib/utils"

export const PODIUM_SLOTS = [
  { position: 2, emoji: "😢", podiumHeight: "h-14", avatarClass: "h-11 w-11", blockColor: "bg-slate-300 dark:bg-slate-600" },
  { position: 1, emoji: "🎉", podiumHeight: "h-24", avatarClass: "h-16 w-16", blockColor: "bg-amber-400 dark:bg-amber-500" },
  { position: 3, emoji: "😅", podiumHeight: "h-9",  avatarClass: "h-9 w-9",   blockColor: "bg-orange-300 dark:bg-orange-700" },
] as const

export interface YearPodiumProps {
  entries: RankingEntry[]
}

export function YearPodium({ entries }: YearPodiumProps) {
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
          const rawEntry = entries[position - 1] ?? null
          const entry = rawEntry && rawEntry.count > 0 ? rawEntry : null
          return (
            <div key={position} className="flex flex-col items-center flex-1 min-w-0">
              {entry ? (
                <>
                  <span className="text-lg mb-1">{emoji}</span>
                  <Avatar className={avatarClass}>
                    <AvatarImage
                      src={entry.profile.photoURL ?? undefined}
                      alt={entry.profile.displayName}
                      referrerPolicy="no-referrer"
                    />
                    <AvatarFallback className="text-xs">{getInitials(entry.profile.displayName)}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium mt-1 truncate max-w-full text-center px-1">
                    {entry.isCurrentUser ? "Você" : entry.profile.displayName}
                  </p>
                  <p
                    className={cn(
                      "font-extrabold tabular-nums",
                      position === 1 ? "text-base text-amber-600 dark:text-amber-400" : "text-sm",
                    )}
                  >
                    {entry.count}
                  </p>
                </>
              ) : (
                <div className="flex-1" />
              )}
              <div
                className={cn(
                  "w-full rounded-t-lg mt-2 flex items-center justify-center",
                  podiumHeight,
                  entry ? blockColor : "bg-muted/50 border-2 border-dashed border-muted-foreground/30",
                )}
              >
                <span className={cn("text-xs font-bold drop-shadow", entry ? "text-white" : "text-muted-foreground")}>
                  {getOrdinal(position)}
                </span>
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
                <AvatarImage
                  src={entry.profile.photoURL ?? undefined}
                  alt={entry.profile.displayName}
                  referrerPolicy="no-referrer"
                />
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
