"use client"

import { useEffect, useState } from "react"
import { loadBadgeContext, getUnlockedBadges, persistNewBadges } from "@/lib/badge-data"
import { evaluateBadges } from "@/lib/badges"
import { BADGES } from "@/lib/badges-catalog"
import type { BadgeDefinition } from "@/lib/badges-catalog"

export interface EvaluatedBadge extends BadgeDefinition {
  unlocked: boolean
}

interface UseBadgesResult {
  badges: EvaluatedBadge[]
  unlockedCount: number
  loading: boolean
  error: string | null
}

export function useBadges(uid: string | null): UseBadgesResult {
  const [badges, setBadges] = useState<EvaluatedBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) {
      setBadges([])
      setLoading(false)
      return
    }

    let cancelled = false
    setBadges([])
    setLoading(true)
    setError(null)

    Promise.all([loadBadgeContext(uid), getUnlockedBadges(uid)])
      .then(([ctx, persisted]) => {
        if (cancelled) return
        const calculated = evaluateBadges(ctx)
        const mergedIds = new Set([
          ...Object.keys(calculated).filter((id) => calculated[id]),
          ...persisted,
        ])
        const newlyUnlocked = Object.keys(calculated).filter(
          (id) => calculated[id] && !persisted.has(id),
        )
        persistNewBadges(uid, newlyUnlocked).catch((err) =>
          console.error("Erro ao persistir conquistas:", err),
        )
        setBadges(BADGES.map((b) => ({ ...b, unlocked: mergedIds.has(b.id) })))
      })
      .catch((err) => {
        if (cancelled) return
        console.error("Erro ao carregar conquistas:", err)
        setError("Não foi possível carregar as conquistas.")
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [uid])

  const unlockedCount = badges.filter((b) => b.unlocked).length

  return { badges, unlockedCount, loading, error }
}
