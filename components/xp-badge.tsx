"use client"

import { Zap } from "lucide-react"
import { useXp } from "@/hooks/use-xp"

export function XpBadge() {
  const xp = useXp()

  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground leading-none">
      <Zap className="h-3 w-3 text-yellow-500 shrink-0" />
      {xp.toLocaleString("pt-BR")} XP
    </span>
  )
}
