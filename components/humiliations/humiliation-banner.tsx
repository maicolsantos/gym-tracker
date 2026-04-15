"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ActiveHumiliation } from "@/hooks/use-humiliations-inbox"

interface HumiliationBannerProps {
  humiliation: ActiveHumiliation
  onDismiss: () => void
}

export function HumiliationBanner({ humiliation, onDismiss }: HumiliationBannerProps) {
  const { senderDisplayName, itemSnapshot } = humiliation
  const { title, description, emoji, nicknameText, category } = itemSnapshot

  return (
    <div
      className={cn(
        "relative w-full rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3",
        "flex items-start gap-3 text-sm",
      )}
      role="alert"
    >
      {/* Emoji or category icon */}
      {emoji && (
        <span className="text-2xl leading-none mt-0.5 shrink-0" aria-hidden>
          {emoji}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-yellow-600 dark:text-yellow-400 leading-tight">
          {senderDisplayName} te humilhou!
        </p>
        <p className="text-muted-foreground mt-0.5">
          <span className="font-medium text-foreground">{title}</span>
          {" — "}
          {description}
        </p>
        {(category === "nickname" || category === "combo") && nicknameText && (
          <p className="mt-1 text-xs text-muted-foreground">
            Apelido atribuído:{" "}
            <span className="font-semibold text-foreground italic">
              &ldquo;{nicknameText}&rdquo;
            </span>
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-foreground -mt-0.5 -mr-1"
        onClick={onDismiss}
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
