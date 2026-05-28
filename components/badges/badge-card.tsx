"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { EvaluatedBadge } from "@/hooks/use-badges"
import { CATEGORY_META } from "@/lib/badges-catalog"

interface BadgeCardProps {
  badge: EvaluatedBadge
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const Icon = badge.icon
  const color = CATEGORY_META[badge.category].colorClass

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={badge.title}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl p-2 gap-1 min-h-[44px] min-w-[44px] transition-opacity",
            badge.unlocked
              ? cn(color, "text-white shadow-sm")
              : "bg-muted text-muted-foreground opacity-40",
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="text-[10px] leading-tight text-center font-medium line-clamp-2 w-full">
            {badge.title}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-56 p-3">
        <p className="font-semibold text-sm">{badge.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
      </PopoverContent>
    </Popover>
  )
}
