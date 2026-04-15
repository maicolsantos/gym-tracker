"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
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

/**
 * Returns the list of friends that the current user is eligible to humiliate,
 * based on the most recently closed monthly ranking.
 *
 * A user is eligible to humiliate friend B if there exists a pair document
 * `monthlyRankings/{prevMonth}/pairs/{uid}_{B}`, meaning uid outranked B.
 */
export function useEligibleTargets(currentUid: string | null) {
  const [targets, setTargets] = useState<EligibleTarget[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUid) return

    setLoading(true)
    const db = getDb()
    const yearMonth = getPreviousYearMonth()
    const pairsRef = collection(db, "monthlyRankings", yearMonth, "pairs")
    const q = query(pairsRef, where("senderUid", "==", currentUid))

    getDocs(q)
      .then(async (snap) => {
        if (snap.empty) {
          setTargets([])
          return
        }

        const pairDocs = snap.docs.map((d) => d.data() as {
          senderUid: string
          recipientUid: string
          senderPosition: number
          recipientPosition: number
        })

        const profileSnaps = await Promise.all(
          pairDocs.map((p) => getDoc(doc(db, "users", p.recipientUid))),
        )

        const result: EligibleTarget[] = pairDocs.flatMap((pair, i) => {
          const snap = profileSnaps[i]
          if (!snap.exists()) return []
          const data = snap.data()
          return [{
            uid: pair.recipientUid,
            displayName: data.displayName ?? "Utilizador",
            photoURL: data.photoURL ?? null,
            recipientPosition: pair.recipientPosition,
            senderPosition: pair.senderPosition,
            yearMonth,
          }]
        })

        setTargets(result.sort((a, b) => a.recipientPosition - b.recipientPosition))
      })
      .catch((err) => console.error("Erro ao buscar alvos elegíveis:", err))
      .finally(() => setLoading(false))
  }, [currentUid])

  return { targets, loading }
}
