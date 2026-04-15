"use client"

import { useState } from "react"
import { Zap, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ShopItem } from "@/lib/shop-catalog"
import type { EligibleTarget } from "@/hooks/use-eligible-targets"

function getInitials(name: string): string {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?"
}

interface PurchaseConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ShopItem
  target: EligibleTarget
  xpAvailable: number
  onConfirm: () => Promise<void>
}

export function PurchaseConfirmDialog({
  open,
  onOpenChange,
  item,
  target,
  xpAvailable,
  onConfirm,
}: PurchaseConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const xpAfter = xpAvailable - item.xpCost

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido. Tenta novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar Humilhação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Item preview */}
          <div className="flex items-center gap-3 rounded-xl border p-3 bg-muted/30">
            <span className="text-3xl leading-none shrink-0">
              {item.emoji ?? "🏷️"}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>

          {/* Target */}
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={target.photoURL ?? undefined} alt={target.displayName} />
              <AvatarFallback className="text-sm">{getInitials(target.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Alvo</p>
              <p className="text-sm font-medium">{target.displayName}</p>
            </div>
          </div>

          {/* XP breakdown */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">XP disponível</span>
              <span className="flex items-center gap-1 font-medium tabular-nums">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                {xpAvailable.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo</span>
              <span className="flex items-center gap-1 font-medium tabular-nums text-red-500">
                <Zap className="h-3.5 w-3.5" />
                -{item.xpCost.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="border-t pt-1 flex justify-between font-semibold">
              <span>Após compra</span>
              <span
                className={`flex items-center gap-1 tabular-nums ${xpAfter < 0 ? "text-red-500" : ""}`}
              >
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                {xpAfter.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          {xpAfter < 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>O teu XP ficará negativo. A humilhação será enviada na mesma.</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "A enviar…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
