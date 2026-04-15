"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { getPreviousYearMonth } from "@/lib/monthly-ranking"

export interface EligibleTarget {
  uid: string
  displayName: string
  photoURL: string | null
  recipientPosition: number
  senderPosition: number
  yearMonth: string
}

function workoutCountForMonth(dates: string[], yearMonth: string): number {
  const prefix = `${yearMonth}-`
  return dates.filter((d) => d.startsWith(prefix)).length
}

/**
 * Returns friends that the current user outranked in the previous month,
 * computed live from workout data (so it works even when friends were added
 * after the monthly circle was already closed).
 */
export function useEligibleTargets(currentUid: string | null) {
  const [targets, setTargets] = useState<EligibleTarget[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUid) return

    setLoading(true)
    const db = getDb()
    const yearMonth = getPreviousYearMonth()

    const run = async () => {
      // 1. Fetch user profile to get friends list
      const userSnap = await getDoc(doc(db, "users", currentUid))
      if (!userSnap.exists()) return

      const friendUids: string[] = userSnap.data().friends ?? []
      if (friendUids.length === 0) return

      // 2. Fetch workout docs for user + all friends in parallel
      const allUids = [currentUid, ...friendUids]
      const [workoutSnaps, friendProfileSnaps] = await Promise.all([
        Promise.all(allUids.map((u) => getDoc(doc(db, "workouts", u)))),
        Promise.all(friendUids.map((u) => getDoc(doc(db, "users", u)))),
      ])

      // 3. Count workouts for the previous month
      const counts = allUids.map((u, i) => {
        const dates: string[] = workoutSnaps[i].exists()
          ? (workoutSnaps[i].data()!.dates ?? [])
          : []
        return { uid: u, count: workoutCountForMonth(dates, yearMonth) }
      })

      const myCount = counts[0].count

      // 4. Friends I outranked (more workouts, or same count but my uid sorts first)
      const beaten = friendUids.flatMap((friendUid, i) => {
        const friendCount = counts[i + 1].count
        const iOutrank =
          myCount > friendCount ||
          (myCount === friendCount && currentUid.localeCompare(friendUid) < 0)
        if (!iOutrank) return []

        const profileSnap = friendProfileSnaps[i]
        const profileData = profileSnap.exists() ? profileSnap.data() : {}

        return [{
          uid: friendUid,
          displayName: profileData?.displayName ?? "Utilizador",
          photoURL: profileData?.photoURL ?? null,
          friendCount,
        }]
      })

      if (beaten.length === 0) return

      // 5. Assign positions (user + all friends ranked together)
      const allParticipants = [
        { uid: currentUid, count: myCount },
        ...friendUids.map((uid, i) => ({ uid, count: counts[i + 1].count })),
      ].sort((a, b) => b.count - a.count || a.uid.localeCompare(b.uid))

      const positionOf = (uid: string) =>
        allParticipants.findIndex((p) => p.uid === uid) + 1

      const myPosition = positionOf(currentUid)

      const result: EligibleTarget[] = beaten.map((t) => ({
        uid: t.uid,
        displayName: t.displayName,
        photoURL: t.photoURL,
        recipientPosition: positionOf(t.uid),
        senderPosition: myPosition,
        yearMonth,
      }))

      setTargets(result.sort((a, b) => a.recipientPosition - b.recipientPosition))
    }

    run()
      .catch((err) => console.error("Erro ao buscar alvos elegíveis:", err))
      .finally(() => setLoading(false))
  }, [currentUid])

  return { targets, loading }
}
