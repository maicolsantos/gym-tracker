"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { FriendList } from "@/components/friend-list"
import { fetchFriendProfiles } from "@/lib/friends"
import type { FriendProfile } from "@/lib/friends"

export interface FriendListLoaderProps {
  currentUid: string
  friendUids: string[]
  onFriendRemoved: (uid: string) => void
}

export function FriendListLoader({ currentUid, friendUids, onFriendRemoved }: FriendListLoaderProps) {
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    if (friendUids.length === 0) {
      setFriends([])
      setLoading(false)
      return () => {
        mounted = false
      }
    }
    fetchFriendProfiles(friendUids)
      .then((profiles) => {
        if (!mounted) return
        setFriends(friendUids.flatMap((uid) => (profiles.get(uid) ? [profiles.get(uid)!] : [])))
      })
      .catch((err) => {
        if (!mounted) return
        console.error("Erro ao buscar perfis:", err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [friendUids])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <FriendList
      currentUid={currentUid}
      friends={friends}
      onFriendRemoved={(uid) => {
        setFriends((prev) => prev.filter((f) => f.uid !== uid))
        onFriendRemoved(uid)
      }}
    />
  )
}
