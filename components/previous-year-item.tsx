"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { YearWorkoutChart, type MonthWorkoutData } from "@/components/year-workout-chart"
import { cn } from "@/lib/utils"

export interface YearSummary {
  year: number
  totalWorkouts: number
  months: MonthWorkoutData[]
}

export interface PreviousYearItemProps {
  yearData: YearSummary
}

export function PreviousYearItem({ yearData }: PreviousYearItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden",
        isOpen
          ? "border-border/80 bg-card/60 shadow-xs"
          : "border-transparent bg-muted/50 hover:bg-muted/70",
      )}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isOpen && "border-b border-border/40 bg-muted/20",
          )}
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
                isOpen && "rotate-180",
              )}
            />
            <span className="text-sm font-semibold">{yearData.year}</span>
          </div>
          <span className="text-xs font-semibold bg-background px-2.5 py-1 rounded-md border border-border/40">
            {yearData.totalWorkouts} {yearData.totalWorkouts === 1 ? "treino" : "treinos"}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-3 pt-2">
        <YearWorkoutChart
          year={yearData.year}
          totalWorkouts={yearData.totalWorkouts}
          months={yearData.months}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
