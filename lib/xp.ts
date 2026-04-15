import { doc, runTransaction, increment, Timestamp } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { XP_WORKOUT } from "@/lib/xp-config"

/**
 * Awards +10 XP for marking a workout day.
 * Idempotent — uses eventKey "workout:{dateKey}" to prevent double-awarding.
 */
export async function awardWorkoutXp(uid: string, dateKey: string): Promise<void> {
  const db = getDb()
  const userRef = doc(db, "users", uid)
  const eventRef = doc(db, "users", uid, "xpEvents", `workout:${dateKey}`)

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef)
    if (eventSnap.exists()) return // already awarded — idempotent guard

    tx.update(userRef, {
      xpTotal: increment(XP_WORKOUT),
      xpAvailable: increment(XP_WORKOUT),
    })
    tx.set(eventRef, {
      eventKey: `workout:${dateKey}`,
      type: "workout",
      amount: XP_WORKOUT,
      createdAt: Timestamp.now(),
      meta: { date: dateKey },
    })
  })
}

/**
 * Reverses the +10 XP when a workout day is unmarked.
 * Idempotent — uses eventKey "reversal:{dateKey}" to prevent double-reversal.
 * xpAvailable may go negative if XP was already spent.
 */
export async function reverseWorkoutXp(uid: string, dateKey: string): Promise<void> {
  const db = getDb()
  const userRef = doc(db, "users", uid)
  const eventRef = doc(db, "users", uid, "xpEvents", `workout:${dateKey}`)
  const reversalRef = doc(db, "users", uid, "xpEvents", `reversal:${dateKey}`)

  await runTransaction(db, async (tx) => {
    const [eventSnap, reversalSnap] = await Promise.all([tx.get(eventRef), tx.get(reversalRef)])
    if (!eventSnap.exists() || reversalSnap.exists()) return // nothing to reverse or already reversed

    tx.update(userRef, {
      xpTotal: increment(-XP_WORKOUT),
      xpAvailable: increment(-XP_WORKOUT),
    })
    tx.set(reversalRef, {
      eventKey: `reversal:${dateKey}`,
      type: "reversal",
      amount: -XP_WORKOUT,
      createdAt: Timestamp.now(),
      meta: { date: dateKey },
    })
  })
}
