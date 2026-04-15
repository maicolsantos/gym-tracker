import { doc, runTransaction, increment, Timestamp } from "firebase/firestore"
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
 * All reads happen inside a single Firestore transaction, eliminating TOCTOU:
 * the circleRef is the authoritative guard — if it exists, the transaction exits
 * immediately without doing any heavy fetches.
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
  const userRef = doc(db, "users", uid)

  await runTransaction(db, async (tx) => {
    // Phase 1: early exit — cheapest possible check
    const circleSnap = await tx.get(circleRef)
    if (circleSnap.exists()) return

    // Phase 2: fetch user profile to get friends list
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists()) return

    const friendUids: string[] = userSnap.data().friends ?? []
    const allUids = [uid, ...friendUids]

    // Phase 3: fetch all workout docs, friend profiles, and xpEvent in parallel
    const xpEventKey = `rank_bonus:${yearMonth}`
    const xpEventRef = doc(db, "users", uid, "xpEvents", xpEventKey)

    const [workoutSnaps, friendProfileSnaps, xpEventSnap] = await Promise.all([
      Promise.all(allUids.map((u) => tx.get(doc(db, "workouts", u)))),
      Promise.all(friendUids.map((u) => tx.get(doc(db, "users", u)))),
      tx.get(xpEventRef),
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

    // --- Writes (all reads must precede all writes) ---

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

    // 3. Eligibility pairs (used in shop)
    for (const { ref, data } of pairRefs) {
      tx.set(ref, data)
    }
  })
}
