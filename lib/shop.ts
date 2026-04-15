import { doc, runTransaction, increment, Timestamp } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import type { ShopItem } from "@/lib/shop-catalog"

export interface PurchaseParams {
  senderUid: string
  senderDisplayName: string
  recipientUid: string
  recipientDisplayName: string
  item: ShopItem
  yearMonth: string
}

/**
 * Purchases a humiliation in an atomic Firestore transaction.
 *
 * Document ID: `{senderUid}_{recipientUid}_{yearMonth}` — enforces max 1 per pair per month.
 *
 * Guards (all checked inside the transaction):
 *   1. No existing humiliation for this pair+month (idempotency)
 *   2. Eligible pair document exists (senderUid outranked recipientUid that month)
 *   3. xpAvailable >= item.xpCost
 *
 * Side-effects on success:
 *   - Creates `humiliations/{id}`
 *   - Increments `users/{senderUid}.xpSpent` / decrements `xpAvailable`
 *   - Appends `users/{senderUid}/xpEvents/purchase:{id}`
 *
 * Returns the humiliation document ID.
 */
export async function purchaseHumiliation(params: PurchaseParams): Promise<string> {
  const {
    senderUid,
    senderDisplayName,
    recipientUid,
    recipientDisplayName,
    item,
    yearMonth,
  } = params

  const db = getDb()
  const humiliationId = `${senderUid}_${recipientUid}_${yearMonth}`
  const humiliationRef = doc(db, "humiliations", humiliationId)
  const senderRef = doc(db, "users", senderUid)
  const xpEventRef = doc(db, "users", senderUid, "xpEvents", `purchase:${humiliationId}`)
  const pairRef = doc(db, "monthlyRankings", yearMonth, "pairs", `${senderUid}_${recipientUid}`)

  await runTransaction(db, async (tx) => {
    const [humiliationSnap, senderSnap, pairSnap] = await Promise.all([
      tx.get(humiliationRef),
      tx.get(senderRef),
      tx.get(pairRef),
    ])

    if (humiliationSnap.exists()) {
      throw new Error("Já enviaste uma humilhação para este amigo este mês.")
    }

    if (!pairSnap.exists()) {
      throw new Error("Não tens elegibilidade para enviar esta humilhação.")
    }

    const xpAvailable: number = senderSnap.data()?.xpAvailable ?? 0
    if (xpAvailable < item.xpCost) {
      throw new Error(
        `XP insuficiente. Precisas de ${item.xpCost} XP, mas tens ${xpAvailable}.`,
      )
    }

    const itemSnapshot: Record<string, unknown> = {
      title: item.title,
      description: item.description,
      xpCost: item.xpCost,
      category: item.category,
    }
    if (item.emoji) itemSnapshot.emoji = item.emoji
    if (item.nicknameText) itemSnapshot.nicknameText = item.nicknameText

    tx.set(humiliationRef, {
      senderUid,
      recipientUid,
      yearMonth,
      itemId: item.id,
      itemSnapshot,
      createdAt: Timestamp.now(),
      senderDisplayName,
      recipientDisplayName,
    })

    tx.update(senderRef, {
      xpSpent: increment(item.xpCost),
      xpAvailable: increment(-item.xpCost),
    })

    tx.set(xpEventRef, {
      eventKey: `purchase:${humiliationId}`,
      type: "purchase",
      amount: -item.xpCost,
      createdAt: Timestamp.now(),
      meta: { humiliationId, month: yearMonth },
    })
  })

  return humiliationId
}
