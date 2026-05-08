import { doc, getDoc, getDocs, collection, runTransaction, increment, updateDoc, Timestamp } from "firebase/firestore"
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
 * Ensures xpTotal / xpAvailable / xpSpent exist on the user document.
 * Derives xpTotal by summing xpEvents if the field is absent.
 * Safe to call on every login — no-op when all fields are already present.
 */
export async function ensureXpFields(uid: string): Promise<void> {
  const db = getDb()
  const userRef = doc(db, "users", uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return

  const data = userSnap.data()
  const hasXpTotal = "xpTotal" in data
  const hasXpAvailable = "xpAvailable" in data
  const hasXpSpent = "xpSpent" in data

  if (hasXpTotal && hasXpAvailable && hasXpSpent) return

  const xpSpent: number = hasXpSpent ? data.xpSpent : 0
  let xpTotal: number

  if (hasXpTotal) {
    xpTotal = data.xpTotal
  } else {
    const eventsSnap = await getDocs(collection(db, "users", uid, "xpEvents"))
    xpTotal = Math.max(0, eventsSnap.docs.reduce((sum, d) => sum + (d.data().amount ?? 0), 0))
  }

  const update: Record<string, number> = {}
  if (!hasXpTotal) update.xpTotal = xpTotal
  // Recalculate xpAvailable whenever xpTotal changes to maintain the invariant
  if (!hasXpAvailable || !hasXpTotal) update.xpAvailable = xpTotal - xpSpent
  if (!hasXpSpent) update.xpSpent = xpSpent

  await updateDoc(userRef, update)
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
