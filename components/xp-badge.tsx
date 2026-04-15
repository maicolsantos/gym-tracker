"use client"

import { useEffect, useRef, useState } from "react"
import { Zap } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { cn } from "@/lib/utils"

interface XpFlash {
  amount: number
  id: number
}

export function XpBadge() {
  const { xpAvailable: xp, loaded } = useXp()
  const prevXpRef = useRef<number | null>(null)
  const [xpFlash, setXpFlash] = useState<XpFlash | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!loaded) return
    if (prevXpRef.current === null) {
      // First real value from Firestore — store it, no flash
      prevXpRef.current = xp
      return
    }
    const delta = xp - prevXpRef.current
    if (delta !== 0) {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      setXpFlash({ amount: delta, id: Date.now() })
      flashTimerRef.current = setTimeout(() => setXpFlash(null), 1000)
    }
    prevXpRef.current = xp
  }, [xp, loaded])

  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground leading-none">
      <Zap className="h-3 w-3 text-yellow-500 shrink-0" />
      {xp.toLocaleString("pt-BR")} XP
      {xpFlash && (
        <span
          key={xpFlash.id}
          className={cn(
            "text-xs font-bold tabular-nums animate-xp-float",
            xpFlash.amount > 0 ? "text-green-500" : "text-red-500",
          )}
        >
          {xpFlash.amount > 0 ? "+" : ""}{xpFlash.amount} XP
        </span>
      )}
    </span>
  )
}
