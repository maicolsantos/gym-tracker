"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
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

function getOrdinal(position: number): string {
  const ordinals = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"]
  return ordinals[position - 1] ?? `${position}º`
}

interface TargetSelectorProps {
  targets: EligibleTarget[]
  loading: boolean
  selected: EligibleTarget | null
  onSelect: (target: EligibleTarget) => void
  yearMonth: string
}

export function TargetSelector({
  targets,
  loading,
  selected,
  onSelect,
  yearMonth,
}: TargetSelectorProps) {
  const [year, month] = yearMonth.split("-")
  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ]
  const label = `${monthNames[Number(month) - 1]} ${year}`

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (targets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-4">
        Sem alvos elegíveis — precisas de ter ficado à frente de um amigo em {label}.
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground mb-2">
        Ranking de {label}
      </p>
      {targets.map((target) => (
        <button
          key={target.uid}
          type="button"
          onClick={() => onSelect(target)}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected?.uid === target.uid
              ? "border-primary bg-primary/10 ring-1 ring-primary"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
          )}
          aria-pressed={selected?.uid === target.uid}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={target.photoURL ?? undefined} alt={target.displayName} />
            <AvatarFallback className="text-xs">{getInitials(target.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{target.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {getOrdinal(target.recipientPosition)} lugar
            </p>
          </div>
          {selected?.uid === target.uid && (
            <span className="text-xs font-semibold text-primary shrink-0">Selecionado</span>
          )}
        </button>
      ))}
    </div>
  )
}
