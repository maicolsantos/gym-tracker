import { doc, getDoc, getDocs, collection } from "firebase/firestore"
import { getDb } from "@/lib/firebase"

export async function exportUserData(uid: string): Promise<void> {
  const db = getDb()

  const [userSnap, workoutSnap, xpEventsSnap] = await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDoc(doc(db, "workouts", uid)),
    getDocs(collection(db, "users", uid, "xpEvents")),
  ])

  const profile = userSnap.exists() ? userSnap.data() : {}
  const workoutDates: string[] = workoutSnap.exists() ? (workoutSnap.data().dates ?? []) : []
  const xpEvents = xpEventsSnap.docs.map((d) => d.data())

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: profile.displayName ?? null,
      friendCode: profile.friendCode ?? null,
      friends: profile.friends ?? [],
      xpTotal: profile.xpTotal ?? 0,
      xpSpent: profile.xpSpent ?? 0,
      xpAvailable: profile.xpAvailable ?? 0,
      createdAt: profile.createdAt?.toDate?.()?.toISOString() ?? null,
    },
    workoutDates,
    xpEvents: xpEvents.map((e) => ({
      eventKey: e.eventKey,
      type: e.type,
      amount: e.amount,
      createdAt: e.createdAt?.toDate?.()?.toISOString() ?? null,
      meta: e.meta ?? null,
    })),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `gym-tracker-dados-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revocation — browser needs time to initiate the download before URL is freed
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
