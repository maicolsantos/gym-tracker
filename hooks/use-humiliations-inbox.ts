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
const PRUNE_AFTER_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

interface DismissedEntry {
  id: string
  dismissedAt: number
}

function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return new Set()
    const entries: DismissedEntry[] = JSON.parse(raw)
    const now = Date.now()
    const fresh = entries.filter((e) => now - e.dismissedAt < PRUNE_AFTER_MS)
    if (fresh.length !== entries.length) {
      localStorage.setItem(LS_KEY, JSON.stringify(fresh))
    }
    return new Set(fresh.map((e) => e.id))
  } catch {
    return new Set()
  }
}

function saveDismissedId(id: string): void {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(LS_KEY)
    const entries: DismissedEntry[] = raw ? JSON.parse(raw) : []
    const filtered = entries.filter((e) => e.id !== id)
    filtered.push({ id, dismissedAt: Date.now() })
    localStorage.setItem(LS_KEY, JSON.stringify(filtered))
  } catch {
    // ignore write errors
  }
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
  // Start as true so the avatar never flashes the real photo before we know
  // whether a humiliation emoji should replace it
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUid) {
      setLoading(false)
      return
    }

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
          .filter((h) => h.yearMonth === yearMonth)
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
    saveDismissedId(current.id)
    setCurrent(null)
  }

  return { humiliation: current, activeHumiliation: active, loading, dismiss }
}
