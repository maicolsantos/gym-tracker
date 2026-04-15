"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

export function useXp() {
  const { user } = useAuth()
  const [xpAvailable, setXpAvailable] = useState(0)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      doc(getDb(), "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          setXpAvailable(snap.data().xpAvailable ?? 0)
        }
      },
      (err) => console.error("Erro ao subscrever XP:", err),
    )
    return unsub
  }, [user])

  return xpAvailable
}
