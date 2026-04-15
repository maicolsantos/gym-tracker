"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { lookupFriendCode, addFriend, fetchFriendProfiles } from "@/lib/friends"
import type { FriendProfile } from "@/lib/friends"

interface AddFriendFormProps {
  currentUid: string
  currentFriends: string[]
  onFriendAdded: (profile: FriendProfile) => void
}

export function AddFriendForm({ currentUid, currentFriends, onFriendAdded }: AddFriendFormProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const normalized = code.trim().toUpperCase()
    if (normalized.length !== 6) {
      setError("O código deve ter 6 caracteres")
      return
    }

    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(normalized)) {
      setError("Código inválido. Use apenas letras e números permitidos.")
      return
    }

    setLoading(true)
    try {
      const friendUid = await lookupFriendCode(normalized)

      if (!friendUid) {
        setError("Código não encontrado")
        return
      }

      if (friendUid === currentUid) {
        setError("Você não pode adicionar a si mesmo")
        return
      }

      if (currentFriends.includes(friendUid)) {
        setError("Você já é amigo desta pessoa")
        return
      }

      // Check friend has a profile
      const profiles = await fetchFriendProfiles([friendUid])
      const friendProfile = profiles.get(friendUid)

      if (!friendProfile) {
        setError("Este utilizador ainda não ativou o recurso de amigos")
        return
      }

      await addFriend(currentUid, friendUid)
      toast.success("Amigo adicionado!")
      onFriendAdded(friendProfile)
      setCode("")
    } catch (err) {
      console.error("Erro ao adicionar amigo:", err)
      setError("Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="friend-code">Código do amigo</Label>
        <Input
          id="friend-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError(null)
          }}
          placeholder="Ex: AB3K7Z"
          maxLength={6}
          className="font-mono text-lg tracking-widest uppercase"
          autoComplete="off"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={loading || code.trim().length === 0} className="w-full">
        <UserPlus className="h-4 w-4 mr-2" />
        {loading ? "A adicionar..." : "Adicionar"}
      </Button>
    </form>
  )
}
