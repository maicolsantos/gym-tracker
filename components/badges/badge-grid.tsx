"use client"

import { BADGES, CATEGORY_META, type BadgeCategory } from "@/lib/badges-catalog"
import { useBadges } from "@/hooks/use-badges"
import { BadgeCard } from "@/components/badges/badge-card"
import { Skeleton } from "@/components/ui/skeleton"

interface BadgeGridProps {
  uid: string
}

const CATEGORY_ORDER: BadgeCategory[] = ["consistency", "ranking", "humiliation", "xp", "social"]

export function BadgeGrid({ uid }: BadgeGridProps) {
  const { badges, unlockedCount, loading, error } = useBadges(uid)

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {BADGES.filter((b) => b.category === cat).map((b) => (
                <Skeleton key={b.id} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const badgeMap = new Map(badges.map((b) => [b.id, b]))

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map((cat) => {
        const meta = CATEGORY_META[cat]
        const categoryBadges = BADGES.filter((b) => b.category === cat)
        const unlocked = categoryBadges.filter((b) => badgeMap.get(b.id)?.unlocked).length

        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {meta.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {unlocked}/{categoryBadges.length}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {categoryBadges.map((b) => {
                const evaluated = badgeMap.get(b.id)
                if (!evaluated) return null
                return <BadgeCard key={b.id} badge={evaluated} />
              })}
            </div>
          </div>
        )
      })}

      <p className="text-xs text-center text-muted-foreground pt-1">
        {unlockedCount} / {BADGES.length} conquistas desbloqueadas
      </p>
    </div>
  )
}
