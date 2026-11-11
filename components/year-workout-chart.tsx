"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import { Flame, Trophy } from "lucide-react"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { MONTHS } from "@/lib/date-utils"

export interface MonthWorkoutData {
  monthName: string
  monthShort: string
  monthIndex: number
  count: number
}

export interface YearWorkoutChartProps {
  year: number
  totalWorkouts: number
  months: MonthWorkoutData[]
  showHeader?: boolean
}

const chartConfig = {
  workouts: {
    label: "Treinos",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function YearWorkoutChart({
  year,
  totalWorkouts,
  months,
  showHeader = false,
}: YearWorkoutChartProps) {
  // Prepara os dados para o gráfico e calcula métricas
  const { chartData, bestMonth } = useMemo(() => {
    // Garante os 12 meses ordenados de Janeiro a Dezembro com inicial e chave única
    const data = months.map((m) => ({
      monthKey: m.monthIndex,
      initial: m.monthName.charAt(0).toUpperCase(),
      monthFull: m.monthName,
      workouts: m.count,
    }))

    // Encontra o melhor mês
    let best = { name: "Nenhum", count: 0 }
    if (months.length > 0) {
      const sorted = [...months].sort((a, b) => b.count - a.count)
      if (sorted[0] && sorted[0].count > 0) {
        best = {
          name: MONTHS[sorted[0].monthIndex],
          count: sorted[0].count,
        }
      }
    }

    return {
      chartData: data,
      bestMonth: best,
    }
  }, [months])

  return (
    <div className="space-y-2">
      {/* Total de Treinos alinhado à esquerda (opcional se não estiver no header do card) */}
      {showHeader && (
        <div className="flex items-center justify-start gap-2 py-0.5 px-0.5">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {totalWorkouts}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            {totalWorkouts === 1 ? "treino no ano" : "treinos no ano"}
          </span>
        </div>
      )}

      {/* Gráfico Shadcn Bar Chart - Compacto */}
      <div className="pt-0.5">
        <ChartContainer config={chartConfig} className="h-[105px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 2, left: 2, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-border/40"
            />
            <XAxis
              dataKey="monthKey"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              className="text-[11px] sm:text-xs font-semibold fill-muted-foreground"
              tickFormatter={(_, index) => chartData[index]?.initial ?? ""}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              content={
                <ChartTooltipContent
                  hideLabel={false}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.monthFull || ""}
                  formatter={(value) => (
                    <span className="font-semibold text-foreground">
                      {value} {Number(value) === 1 ? "treino" : "treinos"}
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="workouts"
              fill="var(--color-workouts)"
              radius={[5, 5, 0, 0]}
              maxBarSize={32}
            >
              <LabelList
                dataKey="workouts"
                position="top"
                offset={6}
                className="fill-foreground text-[10px] font-semibold"
                formatter={(val: number) => (val > 0 ? val : "")}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Rodapé com Destaque do Melhor Mês (coluna única) */}
      <div className="flex items-center pt-1 border-t border-border/40 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 w-full">
          <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          {bestMonth.count > 0 ? (
            <span>
              Melhor mês:{" "}
              <strong className="text-foreground font-semibold">{bestMonth.name}</strong>{" "}
              ({bestMonth.count} {bestMonth.count === 1 ? "treino" : "treinos"})
            </span>
          ) : (
            <span>Nenhum treino registrado</span>
          )}
        </div>
      </div>
    </div>
  )
}
