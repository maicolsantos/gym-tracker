import {
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  writeBatch,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { deleteUser, reauthenticateWithPopup, type User } from "firebase/auth"
import { getDb, getGoogleProvider } from "@/lib/firebase"

const BATCH_LIMIT = 499

async function batchDeleteDocs(db: Firestore, docs: QueryDocumentSnapshot[]) {
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

export async function deleteAccount(user: User): Promise<void> {
  const db = getDb()
  const uid = user.uid

  // 1. Reauth proactively BEFORE any destructive operation.
  //    If the popup is dismissed or blocked, this throws here and nothing is deleted.
  await reauthenticateWithPopup(user, getGoogleProvider())

  // 2. Get friend code before deleting profile
  const userSnap = await getDoc(doc(db, "users", uid))
  const friendCode: string | null = userSnap.exists() ? (userSnap.data().friendCode ?? null) : null

  // 3. Delete xpEvents subcollection (chunked — Firestore batch limit is 500)
  const xpEventsSnap = await getDocs(collection(db, "users", uid, "xpEvents"))
  await batchDeleteDocs(db, xpEventsSnap.docs)

  // 4. Delete user profile, workouts, friend code in parallel
  await Promise.all([
    deleteDoc(doc(db, "users", uid)),
    deleteDoc(doc(db, "workouts", uid)),
    friendCode ? deleteDoc(doc(db, "friendCodes", friendCode)) : Promise.resolve(),
  ])

  // 5. Delete humiliations where user is sender or recipient (deduplified + chunked)
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, "humiliations"), where("senderUid", "==", uid))),
    getDocs(query(collection(db, "humiliations"), where("recipientUid", "==", uid))),
  ])
  const seen = new Set<string>()
  const humiliationDocs = [...sentSnap.docs, ...receivedSnap.docs].filter((d) => {
    if (seen.has(d.id)) return false
    seen.add(d.id)
    return true
  })
  await batchDeleteDocs(db, humiliationDocs)

  // 6. Clear localStorage
  localStorage.clear()

  // 7. Delete Firebase Auth account (must be last — invalidates the token)
  await deleteUser(user)
}
