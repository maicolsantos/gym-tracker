"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { getPreviousYearMonth } from "@/lib/monthly-ranking"

export interface ActiveHumiliation {
  id: string
  senderUid: string
  senderDisplayName: string
  recipientUid: string
  yearMonth: string
  itemSnapshot: {
    title: string
    description: string
    xpCost: number
    category: string
    emoji?: string
    nicknameText?: string
  }
}

const LS_KEY = "humiliation-dismissed"

function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveDismissedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LS_KEY, JSON.stringify([...ids]))
}

/**
 * Fetches active humiliations for the current user (as recipient) based on
 * the previous month's ranking cycle.
 *
 * Dismiss behaviour:
 *  - Dismissed IDs are stored permanently in localStorage.
 *  - A dismissed humiliation never shows again (same sender won't reappear).
 *  - A new humiliation from a different sender is a new ID → not dismissed → shows immediately.
 *  - If multiple undismissed humiliations exist, shows the first (by ID order).
 */
export function useHumiliationsInbox(currentUid: string | null) {
  const [current, setCurrent] = useState<ActiveHumiliation | null>(null)
  // Active humiliation for badge/avatar — persists even after banner is dismissed
  const [active, setActive] = useState<ActiveHumiliation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUid) return

    setLoading(true)
    const db = getDb()
    const yearMonth = getPreviousYearMonth()
    const q = query(
      collection(db, "humiliations"),
      where("recipientUid", "==", currentUid),
      where("yearMonth", "==", yearMonth),
    )

    getDocs(q)
      .then((snap) => {
        if (snap.empty) return

        const all: ActiveHumiliation[] = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as ActiveHumiliation))
          .sort((a, b) => a.id.localeCompare(b.id))

        const dismissed = getDismissedIds()
        const undismissed = all.filter((h) => !dismissed.has(h.id))

        // Badge always shows the first active humiliation for the month
        setActive(all[0] ?? null)
        // Banner only shows undismissed ones
        setCurrent(undismissed[0] ?? null)
      })
      .catch((err) => console.error("Erro ao buscar humilhações:", err))
      .finally(() => setLoading(false))
  }, [currentUid])

  function dismiss() {
    if (!current) return
    const ids = getDismissedIds()
    ids.add(current.id)
    saveDismissedIds(ids)
    setCurrent(null)
  }

  return { humiliation: current, activeHumiliation: active, loading, dismiss }
}
