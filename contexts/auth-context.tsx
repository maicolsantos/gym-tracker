"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { getAuth, getGoogleProvider } from "@/lib/firebase"
import { ensureXpFields } from "@/lib/xp"
import { ensureUserProfile } from "@/lib/friends"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUser(user)
      setLoading(false)
      if (user) {
        // ensureUserProfile creates the users/{uid} doc if absent (required for XP writes)
        ensureUserProfile(user)
          .then(() => ensureXpFields(user.uid))
          .catch(console.error)
      }
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    await signInWithPopup(getAuth(), getGoogleProvider())
  }

  const signOut = async () => {
    await firebaseSignOut(getAuth())
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
