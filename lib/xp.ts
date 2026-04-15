import { doc, getDoc, runTransaction, increment, Timestamp } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { XP_WORKOUT } from "@/lib/xp-config"

/**
 * Awards +10 XP for marking a workout day.
 * Idempotent — uses eventKey "workout:{dateKey}" to prevent double-awarding.
 * If a reversal event exists (workout was previously removed), re-awards XP and clears the reversal.
 */
export async function awardWorkoutXp(uid: string, dateKey: string): Promise<void> {
  const db = getDb()
  const userRef = doc(db, "users", uid)
  const eventRef = doc(db, "users", uid, "xpEvents", `workout:${dateKey}`)
  const reversalRef = doc(db, "users", uid, "xpEvents", `reversal:${dateKey}`)

  await runTransaction(db, async (tx) => {
    const [eventSnap, reversalSnap] = await Promise.all([tx.get(eventRef), tx.get(reversalRef)])

    // Already awarded and no reversal → fully idempotent, nothing to do
    if (eventSnap.exists() && !reversalSnap.exists()) return

    tx.update(userRef, {
      xpTotal: increment(XP_WORKOUT),
      xpAvailable: increment(XP_WORKOUT),
    })
    // Only create the award event if it doesn't exist yet (re-add path skips this)
    if (!eventSnap.exists()) {
      tx.set(eventRef, {
        eventKey: `workout:${dateKey}`,
        type: "workout",
        amount: XP_WORKOUT,
        createdAt: Timestamp.now(),
        meta: { date: dateKey },
      })
    }
    // Remove the reversal so the add/remove cycle can repeat cleanly
    if (reversalSnap.exists()) {
      tx.delete(reversalRef)
    }
  })
}

/**
 * One-time migration: awards XP for every workout day in the current month
 * that doesn't already have an xpEvent. Safe to call on every app start —
 * the idempotency guard inside awardWorkoutXp prevents double-awarding.
 */
export async function migrateCurrentMonthXp(uid: string): Promise<void> {
  const db = getDb()
  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-`

  const workoutSnap = await getDoc(doc(db, "workouts", uid))
  if (!workoutSnap.exists()) return

  const dates: string[] = workoutSnap.data().dates ?? []
  const currentMonthDates = dates.filter((d) => d.startsWith(monthPrefix))

  // Run all awards in parallel — each is independently idempotent
  await Promise.all(currentMonthDates.map((dateKey) => awardWorkoutXp(uid, dateKey)))
}

/**
 * Reverses the +10 XP when a workout day is unmarked.
 * Idempotent — uses eventKey "reversal:{dateKey}" to prevent double-reversal.
 * xpAvailable may go negative if XP was already spent.
 * xpTotal is clamped at 0 to prevent it from going negative due to data corruption.
 */
export async function reverseWorkoutXp(uid: string, dateKey: string): Promise<void> {
  const db = getDb()
  const userRef = doc(db, "users", uid)
  const eventRef = doc(db, "users", uid, "xpEvents", `workout:${dateKey}`)
  const reversalRef = doc(db, "users", uid, "xpEvents", `reversal:${dateKey}`)

  await runTransaction(db, async (tx) => {
    const [eventSnap, reversalSnap, userSnap] = await Promise.all([
      tx.get(eventRef),
      tx.get(reversalRef),
      tx.get(userRef),
    ])
    if (!eventSnap.exists() || reversalSnap.exists()) return // nothing to reverse or already reversed

    const currentXpTotal: number = userSnap.data()?.xpTotal ?? 0
    const currentXpAvailable: number = userSnap.data()?.xpAvailable ?? 0
    const currentXpSpent: number = userSnap.data()?.xpSpent ?? 0

    // Clamp the delta so xpTotal never goes negative
    const delta = Math.min(XP_WORKOUT, currentXpTotal)
    const newXpTotal = currentXpTotal - delta
    // xpAvailable can legitimately go negative (user spent XP before reversing workout)
    const newXpAvailable = newXpTotal - currentXpSpent

    tx.update(userRef, {
      xpTotal: newXpTotal,
      xpAvailable: newXpAvailable,
    })
    tx.set(reversalRef, {
      eventKey: `reversal:${dateKey}`,
      type: "reversal",
      amount: -delta,
      createdAt: Timestamp.now(),
      meta: { date: dateKey },
    })
  })
}
