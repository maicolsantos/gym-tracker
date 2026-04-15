"use client"

import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ShopItem } from "@/lib/shop-catalog"
import { CATEGORY_LABELS } from "@/lib/shop-catalog"

interface ShopItemCardProps {
  item: ShopItem
  selected: boolean
  affordable: boolean
  onSelect: (item: ShopItem) => void
}

export function ShopItemCard({ item, selected, affordable, onSelect }: ShopItemCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "w-full text-left rounded-xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary"
          : affordable
            ? "border-border hover:border-primary/50 hover:bg-muted/50"
            : "border-border opacity-50 cursor-not-allowed",
      )}
      disabled={!affordable}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        {item.emoji ? (
          <span className="text-2xl leading-none mt-0.5 shrink-0">{item.emoji}</span>
        ) : (
          <span className="text-2xl leading-none mt-0.5 shrink-0">🏷️</span>
        )}

        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-semibold truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[item.category]}
            </span>
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-bold tabular-nums",
                affordable ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground",
              )}
            >
              <Zap className="h-3 w-3 shrink-0" />
              {item.xpCost.toLocaleString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
