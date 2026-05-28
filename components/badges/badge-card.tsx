"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
    <Tooltip>
      <TooltipTrigger asChild>
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
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-semibold">{badge.title}</p>
        <p className="text-xs text-balance opacity-90">{badge.description}</p>
      </TooltipContent>
    </Tooltip>
  )
}
