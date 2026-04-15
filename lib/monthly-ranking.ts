import { doc, getDoc, runTransaction, increment, Timestamp } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { XP_RANK_BONUS, XP_RANK_FALLBACK } from "@/lib/xp-config"

export interface RankingParticipant {
  uid: string
  displayName: string
  workoutCount: number
  position: number
  xpBonusAwarded: number
}

/**
 * Returns the yearMonth string for the previous month (e.g. "2026-03").
 * The current month never qualifies for closing.
 */
export function getPreviousYearMonth(): string {
  const now = new Date()
  // First day of current month, minus 1 day = last day of previous month
  const d = new Date(now.getFullYear(), now.getMonth(), 0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function workoutCountForMonth(dates: string[], yearMonth: string): number {
  const prefix = `${yearMonth}-`
  return dates.filter((d) => d.startsWith(prefix)).length
}

/**
 * Closes the previous month's ranking for the calling user's friend circle.
 *
 * - Idempotent: guarded by `monthlyRankings/{yearMonth}/circles/{uid}`
 * - Awards XP rank bonus to the calling user only (each user claims their own)
 * - Writes eligible humiliation pairs where the calling user is the sender
 *
 * Structure written:
 *   monthlyRankings/{yearMonth}/circles/{uid}   — snapshot of this user's circle
 *   monthlyRankings/{yearMonth}/pairs/{uid}_{B} — one doc per friend that uid outranked
 */
export async function closeMonthIfNeeded(
  uid: string,
  displayName: string,
): Promise<void> {
  const db = getDb()
  const yearMonth = getPreviousYearMonth()
  const circleRef = doc(db, "monthlyRankings", yearMonth, "circles", uid)

  // Fast pre-check before any heavy fetches
  const circleSnap = await getDoc(circleRef)
  if (circleSnap.exists()) return

  // Fetch user profile for friends list
  const userRef = doc(db, "users", uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return

  const friendUids: string[] = userSnap.data().friends ?? []
  const allUids = [uid, ...friendUids]

  // Fetch all workout docs and friend profiles in parallel
  const [workoutSnaps, friendProfileSnaps] = await Promise.all([
    Promise.all(allUids.map((u) => getDoc(doc(db, "workouts", u)))),
    Promise.all(friendUids.map((u) => getDoc(doc(db, "users", u)))),
  ])

  // Build sorted participant list
  const participants = allUids.map((u, i) => {
    const dates: string[] = workoutSnaps[i].exists() ? (workoutSnaps[i].data()!.dates ?? []) : []
    const count = workoutCountForMonth(dates, yearMonth)
    const name =
      u === uid
        ? displayName
        : friendProfileSnaps[i - 1]?.exists()
          ? (friendProfileSnaps[i - 1].data()!.displayName ?? "Utilizador")
          : "Utilizador"
    return { uid: u, displayName: name, workoutCount: count }
  })

  // Sort descending by workoutCount; break ties deterministically by uid
  participants.sort(
    (a, b) => b.workoutCount - a.workoutCount || a.uid.localeCompare(b.uid),
  )

  const ranked: RankingParticipant[] = participants.map((p, idx) => {
    const position = idx + 1
    return {
      ...p,
      position,
      xpBonusAwarded: XP_RANK_BONUS[position] ?? XP_RANK_FALLBACK,
    }
  })

  const myEntry = ranked.find((p) => p.uid === uid)
  if (!myEntry) return

  const xpEventKey = `rank_bonus:${yearMonth}`
  const xpEventRef = doc(db, "users", uid, "xpEvents", xpEventKey)

  // Pair refs to write (uid outranked these participants)
  const pairRefs = ranked
    .filter((p) => myEntry.position < p.position)
    .map((p) => ({
      ref: doc(db, "monthlyRankings", yearMonth, "pairs", `${uid}_${p.uid}`),
      data: {
        senderUid: uid,
        recipientUid: p.uid,
        senderPosition: myEntry.position,
        recipientPosition: p.position,
      },
    }))

  await runTransaction(db, async (tx) => {
    // All reads must precede all writes in a Firestore transaction
    const [circleSnap2, xpEventSnap] = await Promise.all([
      tx.get(circleRef),
      tx.get(xpEventRef),
    ])

    if (circleSnap2.exists()) return // already closed by a concurrent session

    // --- Writes ---

    // 1. Immutable circle snapshot
    tx.set(circleRef, {
      yearMonth,
      closedAt: Timestamp.now(),
      participants: ranked,
    })

    // 2. XP rank bonus (idempotent via xpEvents)
    if (!xpEventSnap.exists()) {
      tx.update(userRef, {
        xpTotal: increment(myEntry.xpBonusAwarded),
        xpAvailable: increment(myEntry.xpBonusAwarded),
      })
      tx.set(xpEventRef, {
        eventKey: xpEventKey,
        type: "rank_bonus",
        amount: myEntry.xpBonusAwarded,
        createdAt: Timestamp.now(),
        meta: { month: yearMonth, position: myEntry.position },
      })
    }

    // 3. Eligibility pairs (used in Phase 3 shop)
    for (const { ref, data } of pairRefs) {
      tx.set(ref, data)
    }
  })
}
