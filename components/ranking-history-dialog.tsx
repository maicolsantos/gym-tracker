"use client"

import { CalendarDays, Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { YearPodium } from "@/components/year-podium"
import { getInitials, getOrdinal, type RankingEntry } from "@/components/ranking-list"
import { MONTHS } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

export interface MonthRankingHistoryItem {
  month: number
  top3: RankingEntry[]
  hasWorkouts: boolean
  maxCount: number
}

export interface RankingHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableYears: number[]
  selectedHistoryYear: number
  onSelectYear: (year: number) => void
  currentYear: number
  selectedYearPodiumEntries: RankingEntry[]
  selectedYearMonthsData: MonthRankingHistoryItem[]
}

export function RankingHistoryDialog({
  open,
  onOpenChange,
  availableYears,
  selectedHistoryYear,
  onSelectYear,
  currentYear,
  selectedYearPodiumEntries,
  selectedYearMonthsData,
}: RankingHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto overscroll-contain">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Histórico de Rankings
          </DialogTitle>
          {availableYears.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
              {availableYears.map((y) => (
                <Button
                  key={y}
                  type="button"
                  variant={selectedHistoryYear === y ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 text-xs px-2.5 rounded-full shrink-0 transition-colors",
                    selectedHistoryYear === y && "font-semibold shadow-xs",
                  )}
                  onClick={() => onSelectYear(y)}
                >
                  {y} {y === currentYear ? "(Atual)" : ""}
                </Button>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Pódio Final para Anos Anteriores */}
          {selectedHistoryYear < currentYear && (
            <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 justify-center">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Pódio Final {selectedHistoryYear}
                </p>
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <YearPodium entries={selectedYearPodiumEntries} />
            </div>
          )}

          {/* Lista dos Meses */}
          <div className="space-y-3">
            {selectedHistoryYear < currentYear && (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
                Rankings Mensais {selectedHistoryYear}
              </p>
            )}

            {selectedYearMonthsData.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Nenhum treino registrado em {selectedHistoryYear}
              </p>
            ) : (
              selectedYearMonthsData.map(({ month: m, top3, hasWorkouts, maxCount }) => (
                <div key={m} className="rounded-xl border bg-muted/30 overflow-hidden">
                  <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {MONTHS[m]}
                      {selectedHistoryYear !== currentYear ? ` ${selectedHistoryYear}` : ""}
                    </p>
                  </div>
                  <div className="px-3 py-2">
                    {!hasWorkouts ? (
                      <p className="text-xs text-muted-foreground italic py-1">Sem treinos</p>
                    ) : (
                      <ol className="space-y-1.5">
                        {top3
                          .filter((e) => e.count > 0)
                          .map((entry, idx) => (
                            <li
                              key={entry.profile.uid}
                              className={cn(
                                "flex items-center gap-3 p-1.5 rounded-lg",
                                entry.isCurrentUser && "bg-primary/10 border border-primary/20",
                              )}
                            >
                              <span className="text-xs font-bold w-5 text-center text-muted-foreground">
                                {getOrdinal(idx + 1)}
                              </span>
                              <Avatar className="h-7 w-7">
                                <AvatarImage
                                  src={entry.profile.photoURL ?? undefined}
                                  alt={entry.profile.displayName}
                                  referrerPolicy="no-referrer"
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(entry.profile.displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {entry.isCurrentUser ? "Você" : entry.profile.displayName}
                                </p>
                                <Progress
                                  value={maxCount > 0 ? (entry.count / maxCount) * 100 : 0}
                                  className="h-1 mt-1"
                                />
                              </div>
                              <span className="text-xs font-bold tabular-nums w-6 text-right">
                                {entry.count}
                              </span>
                            </li>
                          ))}
                      </ol>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
