"use client"

import { useState } from "react"
import { UserX } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { removeFriend } from "@/lib/friends"
import type { FriendProfile } from "@/lib/friends"

interface FriendListProps {
  currentUid: string
  friends: FriendProfile[]
  onFriendRemoved: (uid: string) => void
}

function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  return trimmed
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function FriendList({ currentUid, friends, onFriendRemoved }: FriendListProps) {
  const [removingUid, setRemovingUid] = useState<string | null>(null)

  const handleRemove = async (friendUid: string) => {
    setRemovingUid(friendUid)
    // Optimistic
    onFriendRemoved(friendUid)
    try {
      await removeFriend(currentUid, friendUid)
      toast.success("Amigo removido")
    } catch (err) {
      console.error("Erro ao remover amigo:", err)
      toast.error("Erro ao remover amigo. Tente novamente.")
      // Rollback handled by parent — not refetching here, user can reload
    } finally {
      setRemovingUid(null)
    }
  }

  if (friends.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-4">
        Ainda não tens amigos adicionados
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {friends.map((friend) => (
        <li
          key={friend.uid}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={friend.photoURL ?? undefined}
              alt={friend.displayName}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm font-medium truncate">{friend.displayName}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleRemove(friend.uid)}
            disabled={removingUid === friend.uid}
            title="Remover amigo"
          >
            <UserX className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  )
}
