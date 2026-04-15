"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { FriendCodeDisplay } from "@/components/friend-code-display"
import { AddFriendForm } from "@/components/add-friend-form"
import { FriendListLoader } from "@/components/friend-list"
import { FriendRanking } from "@/components/friend-ranking"
import { ensureUserProfile } from "@/lib/friends"
import type { UserProfile } from "@/lib/friends"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"

export default function FriendsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [friendUids, setFriendUids] = useState<string[]>([])
  const [workouts, setWorkouts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("ranking")

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/")
      return
    }

    Promise.all([
      ensureUserProfile(user),
      getDoc(doc(getDb(), "workouts", user.uid)),
    ])
      .then(([p, workoutSnap]) => {
        setProfile(p)
        setFriendUids(p.friends)
        if (workoutSnap.exists()) {
          setWorkouts(new Set(workoutSnap.data().dates as string[]))
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar perfil:", err)
        setError("Não foi possível carregar o teu perfil. Tenta novamente.")
      })
      .finally(() => setLoading(false))
  }, [user, authLoading, router])

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Amigos
          </h1>
        </div>

        {loading || authLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center">{error}</p>
        ) : profile ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="ranking" className="flex-1">Ranking</TabsTrigger>
              <TabsTrigger value="adicionar" className="flex-1">Adicionar</TabsTrigger>
              <TabsTrigger value="codigo" className="flex-1">Meu Código</TabsTrigger>
            </TabsList>

            <TabsContent value="ranking" className="mt-4">
              <FriendRanking
                currentUid={profile.uid}
                friendUids={friendUids}
                currentUserProfile={profile}
                currentUserWorkouts={workouts}
              />
            </TabsContent>

            <TabsContent value="adicionar" className="mt-4">
              <AddFriendForm
                currentUid={profile.uid}
                currentFriends={friendUids}
                onFriendAdded={(newProfile) => {
                  setFriendUids((prev) =>
                    prev.includes(newProfile.uid) ? prev : [...prev, newProfile.uid],
                  )
                  setActiveTab("ranking")
                }}
              />
            </TabsContent>

            <TabsContent value="codigo" className="space-y-4 mt-4">
              <FriendCodeDisplay code={profile.friendCode} />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Amigos ({friendUids.length})
                </p>
                <FriendListLoader
                  currentUid={profile.uid}
                  friendUids={friendUids}
                  onFriendRemoved={(uid) =>
                    setFriendUids((prev) => prev.filter((id) => id !== uid))
                  }
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  )
}
