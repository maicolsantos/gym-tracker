import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import type { BadgeContext } from "@/lib/badges"

const MONTHS_TO_CHECK = 24

function getLast24Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 1; i <= MONTHS_TO_CHECK; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return months
}

export async function loadBadgeContext(uid: string): Promise<BadgeContext> {
  const db = getDb()

  const [userSnap, workoutSnap, rankingSnaps, humSentSnap, humReceivedSnap] = await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDoc(doc(db, "workouts", uid)),
    Promise.all(
      getLast24Months().map((ym) => getDoc(doc(db, "monthlyRankings", ym, "circles", uid))),
    ),
    getDocs(query(collection(db, "humiliations"), where("senderUid", "==", uid), limit(500))),
    getDocs(query(collection(db, "humiliations"), where("recipientUid", "==", uid), limit(500))),
  ])

  const userData = userSnap.exists() ? userSnap.data() : null
  const xpTotal = userData?.xpTotal ?? 0
  const friendsCount = (userData?.friends as string[] | undefined ?? []).length

  const workoutDates: string[] = workoutSnap.exists() ? (workoutSnap.data().dates ?? []) : []

  const monthlyRankings: BadgeContext["monthlyRankings"] = []
  for (const snap of rankingSnaps) {
    if (!snap.exists()) continue
    const data = snap.data()
    if (typeof data.yearMonth !== "string") continue
    const participants = (data.participants ?? []) as { uid: string; position: number }[]
    const mine = participants.find((p) => p.uid === uid)
    if (!mine) continue
    monthlyRankings.push({
      yearMonth: data.yearMonth,
      position: mine.position,
      participantsCount: participants.length,
    })
  }

  const humiliationsSent = humSentSnap.docs.map((d) => {
    const data = d.data()
    return { recipientUid: data.recipientUid as string, yearMonth: data.yearMonth as string }
  })

  const humiliationsReceived = humReceivedSnap.docs.map((d) => {
    const data = d.data()
    return { senderUid: data.senderUid as string, yearMonth: data.yearMonth as string }
  })

  return { workoutDates, xpTotal, friendsCount, monthlyRankings, humiliationsSent, humiliationsReceived }
}
