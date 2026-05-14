"use client"

import { useState } from "react"
import { type User } from "firebase/auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { signOut } from "firebase/auth"
import { getAuth } from "@/lib/firebase"
import { deleteAccount } from "@/lib/delete-account"

const AUTH_ERROR_CODES = new Set([
  "auth/requires-recent-login",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/popup-blocked",
  "auth/user-token-expired",
])

interface Props {
  user: User
  trigger: React.ReactNode
}

export function DeleteAccountDialog({ user, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await deleteAccount(user)
      // onAuthStateChanged fires with null → app redirects to login automatically
    } catch (err) {
      const code = (err as { code?: string }).code ?? ""
      if (AUTH_ERROR_CODES.has(code)) {
        // Credentials stale or popup dismissed — sign out for security
        setOpen(false)
        await signOut(getAuth()).catch(() => {})
      } else {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        setLoading(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar conta</DialogTitle>
          <DialogDescription>
            Esta ação é <strong>irreversível</strong>. Todos os teus dados serão apagados
            permanentemente: treinos, XP, amigos e humilhações.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "A eliminar…" : "Eliminar conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
