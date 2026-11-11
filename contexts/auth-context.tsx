"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
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
  signInForTesting?: (name?: string) => Promise<void>
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

  const signInForTesting = async (name = "Atleta Teste") => {
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "true") return
    const auth = getAuth()
    const email = "atleta.e2e@exemplo.com"
    const pass = "teste123456"
    let user
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass)
      user = cred.user
    } catch {
      const cred = await createUserWithEmailAndPassword(auth, email, pass)
      await updateProfile(cred.user, {
        displayName: name,
        photoURL: "https://avatar.vercel.sh/test",
      })
      user = cred.user
    }
    await user.getIdToken(true)
    setUser(user)
  }

  const signOut = async () => {
    await firebaseSignOut(getAuth())
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, signInForTesting }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
