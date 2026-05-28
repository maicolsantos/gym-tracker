"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ensureUserProfile } from "@/lib/friends"
import type { UserProfile } from "@/lib/friends"
import { SettingsPanel } from "@/components/profile/settings-panel"
import { ProfilePanel } from "@/components/profile/profile-panel"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/")
      return
    }

    let cancelled = false
    ensureUserProfile(user)
      .then((p) => { if (!cancelled) setProfile(p) })
      .catch((err) => {
        if (cancelled) return
        console.error("Erro ao carregar perfil:", err)
        setError("Não foi possível carregar o teu perfil. Tenta novamente.")
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [user?.uid, authLoading, router])

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading || authLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center">{error}</p>
        ) : user && profile ? (
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
            {/* Mobile: profile first, settings below */}
            <div className="order-2 md:order-1">
              <SettingsPanel user={user} />
            </div>
            <div className="order-1 md:order-2">
              <ProfilePanel user={user} profile={profile} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
