import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  writeBatch,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore"
import type { User } from "firebase/auth"
import { getDb } from "@/lib/firebase"

export interface UserProfile {
  uid: string
  displayName: string
  photoURL: string | null
  friendCode: string
  friends: string[]
}

const FRIEND_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateFriendCode(): string {
  const randomBytes = new Uint32Array(6)
  crypto.getRandomValues(randomBytes)
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += FRIEND_CODE_CHARS[randomBytes[i] % FRIEND_CODE_CHARS.length]
  }
  return code
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const db = getDb()
  const userRef = doc(db, "users", user.uid)

  const snap = await getDoc(userRef)
  if (snap.exists()) {
    const data = snap.data()
    return {
      uid: user.uid,
      displayName: data.displayName,
      photoURL: data.photoURL,
      friendCode: data.friendCode,
      friends: data.friends ?? [],
    }
  }

  // Create new profile with collision retry
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateFriendCode()
    const codeRef = doc(db, "friendCodes", code)

    try {
      await runTransaction(db, async (tx) => {
        const codeSnap = await tx.get(codeRef)
        if (codeSnap.exists()) {
          throw new Error("CODE_COLLISION")
        }
        tx.set(userRef, {
          displayName: user.displayName ?? "Utilizador",
          photoURL: user.photoURL ?? null,
          friendCode: code,
          friends: [],
          createdAt: Timestamp.now(),
        })
        tx.set(codeRef, { uid: user.uid })
      })

      return {
        uid: user.uid,
        displayName: user.displayName ?? "Utilizador",
        photoURL: user.photoURL ?? null,
        friendCode: code,
        friends: [],
      }
    } catch (err) {
      if (err instanceof Error && err.message === "CODE_COLLISION") {
        continue
      }
      throw err
    }
  }

  throw new Error("Não foi possível gerar um código de amigo único. Tente novamente.")
}

export async function lookupFriendCode(code: string): Promise<string | null> {
  const db = getDb()
  const codeRef = doc(db, "friendCodes", code.toUpperCase())
  const snap = await getDoc(codeRef)
  if (!snap.exists()) return null
  return snap.data().uid as string
}

export async function addFriend(currentUid: string, friendUid: string): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)
  batch.update(doc(db, "users", currentUid), { friends: arrayUnion(friendUid) })
  batch.update(doc(db, "users", friendUid), { friends: arrayUnion(currentUid) })
  await batch.commit()
}

export async function removeFriend(currentUid: string, friendUid: string): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)
  batch.update(doc(db, "users", currentUid), { friends: arrayRemove(friendUid) })
  batch.update(doc(db, "users", friendUid), { friends: arrayRemove(currentUid) })
  await batch.commit()
}

export async function fetchFriendProfiles(uids: string[]): Promise<Map<string, UserProfile>> {
  const db = getDb()
  const profiles = new Map<string, UserProfile>()
  if (uids.length === 0) return profiles

  await Promise.all(
    uids.map(async (uid) => {
      const snap = await getDoc(doc(db, "users", uid))
      if (snap.exists()) {
        const data = snap.data()
        profiles.set(uid, {
          uid,
          displayName: data.displayName,
          photoURL: data.photoURL,
          friendCode: data.friendCode,
          friends: data.friends ?? [],
        })
      }
    }),
  )

  return profiles
}

export async function fetchFriendWorkouts(uids: string[]): Promise<Map<string, string[]>> {
  const db = getDb()
  const workouts = new Map<string, string[]>()
  if (uids.length === 0) return workouts

  const capped = uids.slice(0, 20)

  await Promise.all(
    capped.map(async (uid) => {
      const snap = await getDoc(doc(db, "workouts", uid))
      if (snap.exists()) {
        workouts.set(uid, snap.data().dates ?? [])
      } else {
        workouts.set(uid, [])
      }
    }),
  )

  return workouts
}
