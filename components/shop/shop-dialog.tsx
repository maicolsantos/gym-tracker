"use client"

import { useState } from "react"
import { ShoppingBag, Zap, ChevronLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShopItemCard } from "@/components/shop/shop-item-card"
import { TargetSelector } from "@/components/shop/target-selector"
import { PurchaseConfirmDialog } from "@/components/shop/purchase-confirm-dialog"
import { useEligibleTargets } from "@/hooks/use-eligible-targets"
import { purchaseHumiliation } from "@/lib/shop"
import { SHOP_CATALOG, CATEGORY_LABELS } from "@/lib/shop-catalog"
import type { ShopCategory, ShopItem } from "@/lib/shop-catalog"
import type { EligibleTarget } from "@/hooks/use-eligible-targets"
import { cn } from "@/lib/utils"
import { getPreviousYearMonth } from "@/lib/monthly-ranking"

type Step = "browse" | "target"

const CATEGORIES: ShopCategory[] = ["nickname", "avatar", "combo"]

interface ShopDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUid: string
  currentUserDisplayName: string
  xpAvailable: number
}

export function ShopDialog({
  open,
  onOpenChange,
  currentUid,
  currentUserDisplayName,
  xpAvailable,
}: ShopDialogProps) {
  const [step, setStep] = useState<Step>("browse")
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("nickname")
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<EligibleTarget | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { targets, loading: targetsLoading } = useEligibleTargets(
    open ? currentUid : null,
  )
  const yearMonth = getPreviousYearMonth()

  const visibleItems = SHOP_CATALOG.filter((item) => item.category === activeCategory)

  function handleSelectItem(item: ShopItem) {
    setSelectedItem(item)
    setSelectedTarget(null)
    setStep("target")
  }

  function handleBack() {
    setStep("browse")
    setSelectedItem(null)
    setSelectedTarget(null)
  }

  function handleOpenConfirm() {
    if (!selectedItem || !selectedTarget) return
    setConfirmOpen(true)
  }

  async function handlePurchase() {
    if (!selectedItem || !selectedTarget) return
    await purchaseHumiliation({
      senderUid: currentUid,
      senderDisplayName: currentUserDisplayName,
      recipientUid: selectedTarget.uid,
      recipientDisplayName: selectedTarget.displayName,
      item: selectedItem,
      yearMonth: selectedTarget.yearMonth,
    })
    setSuccessMsg(
      `Humilhação "${selectedItem.title}" enviada para ${selectedTarget.displayName}!`,
    )
    setStep("browse")
    setSelectedItem(null)
    setSelectedTarget(null)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  function handleDialogClose(val: boolean) {
    if (!val) {
      setStep("browse")
      setSelectedItem(null)
      setSelectedTarget(null)
      setSuccessMsg(null)
    }
    onOpenChange(val)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-sm max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Loja de Humilhações
            </DialogTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="tabular-nums font-medium">
                {xpAvailable.toLocaleString("pt-BR")} XP disponível
              </span>
            </div>
          </DialogHeader>

          {step === "browse" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Category tabs */}
              <div className="flex border-b shrink-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "flex-1 py-2 text-xs font-medium transition-colors",
                      activeCategory === cat
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Item grid */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2">
                {successMsg && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-xs text-green-700 dark:text-green-400 text-center">
                    {successMsg}
                  </div>
                )}
                {visibleItems.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    selected={selectedItem?.id === item.id}
                    affordable={xpAvailable >= item.xpCost}
                    onSelect={handleSelectItem}
                  />
                ))}
              </div>
            </div>
          )}

          {step === "target" && selectedItem && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Selected item summary + back */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0 bg-muted/30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleBack}
                  aria-label="Voltar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg leading-none">{selectedItem.emoji ?? "🏷️"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedItem.title}</p>
                  <p className="flex items-center gap-0.5 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    <Zap className="h-3 w-3" />
                    {selectedItem.xpCost.toLocaleString("pt-BR")} XP
                  </p>
                </div>
              </div>

              {/* Target selector */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Escolhe o alvo
                </p>
                <TargetSelector
                  targets={targets}
                  loading={targetsLoading}
                  selected={selectedTarget}
                  onSelect={setSelectedTarget}
                  yearMonth={targets[0]?.yearMonth ?? yearMonth}
                />
              </div>

              <div className="px-4 pb-4 pt-2 border-t shrink-0">
                <Button
                  className="w-full"
                  disabled={!selectedTarget}
                  onClick={handleOpenConfirm}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {confirmOpen && selectedItem && selectedTarget && (
        <PurchaseConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          item={selectedItem}
          target={selectedTarget}
          xpAvailable={xpAvailable}
          onConfirm={handlePurchase}
        />
      )}
    </>
  )
}
