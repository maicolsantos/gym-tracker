"use client"

import { useState } from "react"
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Timer,
  Info,
  Edit2,
  Check,
  Dumbbell,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { WorkoutExercise } from "@/lib/exercises/types"
import { getExerciseById } from "@/lib/exercises/catalog"
import { cn } from "@/lib/utils"

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise
  index: number
  totalCount: number
  onUpdate: (updated: WorkoutExercise) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onStartRest: (seconds: number) => void
}

export function WorkoutExerciseCard({
  exercise,
  index,
  totalCount,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onStartRest,
}: WorkoutExerciseCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Estados locais para edição
  const [sets, setSets] = useState(exercise.sets)
  const [reps, setReps] = useState(exercise.reps)
  const [weightKg, setWeightKg] = useState<number>(exercise.weightKg ?? 0)
  const [restSeconds, setRestSeconds] = useState(exercise.restSeconds)
  const [notes, setNotes] = useState(exercise.notes ?? "")

  const handleSaveEdit = () => {
    const updated: WorkoutExercise = {
      ...exercise,
      sets: Number(sets) || 1,
      reps: reps.trim() || "10",
      restSeconds: Number(restSeconds) || 60,
    }
    if (weightKg > 0) {
      updated.weightKg = Number(weightKg)
    } else {
      delete updated.weightKg
    }
    if (notes.trim()) {
      updated.notes = notes.trim()
    } else {
      delete updated.notes
    }
    onUpdate(updated)
    setIsEditing(false)
  }

  const handleQuickWeightAdjust = (delta: number) => {
    const current = exercise.weightKg ?? 0
    const newWeight = Math.max(0, current + delta)
    const updated = { ...exercise }
    if (newWeight > 0) {
      updated.weightKg = newWeight
    } else {
      delete updated.weightKg
    }
    onUpdate(updated)
  }

  const imageUrl = !imgError ? (exercise.thumbUrl || exercise.gifUrl) : null

  return (
    <>
      <div className="group relative rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-all">
        {/* Topo: Miniatura + Info + Botões de Ação na Direita */}
        <div className="flex items-start justify-between gap-2.5">
          {/* Lado Esquerdo: Miniatura e Info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Miniatura com Fallback Seguro */}
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg border bg-muted flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              title="Ver animação e execução"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={exercise.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => setImgError(true)}
                />
              ) : (
                <Dumbbell className="h-5 w-5 text-muted-foreground/60" />
              )}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Play className="h-3.5 w-3.5 text-white fill-white" />
              </div>
            </button>

            {/* Info Textual */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 leading-tight">
                  {exercise.muscleLabel}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-muted text-muted-foreground leading-tight">
                  {exercise.equipmentLabel}
                </span>
              </div>

              <h4
                onClick={() => setShowDetails(true)}
                className="text-xs sm:text-sm font-semibold leading-tight text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                title={exercise.name}
              >
                {exercise.name}
              </h4>

              {exercise.notes && !isEditing && (
                <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1 break-words">
                  📝 {exercise.notes}
                </p>
              )}
            </div>
          </div>

          {/* Lado Direito: Ações (Sempre fixas e compactas no topo) */}
          <div className="flex items-center gap-0.5 shrink-0 -mr-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              disabled={index === 0}
              onClick={onMoveUp}
              title="Mover para cima"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              disabled={index === totalCount - 1}
              onClick={onMoveDown}
              title="Mover para baixo"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (isEditing) {
                  handleSaveEdit()
                } else {
                  setSets(exercise.sets)
                  setReps(exercise.reps)
                  setWeightKg(exercise.weightKg ?? 0)
                  setRestSeconds(exercise.restSeconds)
                  setNotes(exercise.notes ?? "")
                  setIsEditing(true)
                }
              }}
              title={isEditing ? "Salvar alterações" : "Editar exercício"}
            >
              {isEditing ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Edit2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              onClick={onRemove}
              title="Remover exercício"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Linha de Métricas: Séries / Repetições / Carga / Descanso */}
        {!isEditing ? (
          <div className="mt-2.5 pt-2.5 border-t grid grid-cols-4 gap-1.5 sm:gap-2 text-xs">
            {/* Séries */}
            <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Séries
              </span>
              <span className="font-bold text-xs sm:text-sm text-foreground mt-0.5">
                {exercise.sets}
              </span>
            </div>

            {/* Repetições */}
            <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Reps
              </span>
              <span className="font-bold text-xs sm:text-sm text-foreground mt-0.5 truncate max-w-full">
                {exercise.reps}
              </span>
            </div>

            {/* Carga */}
            <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Carga
              </span>
              <div className="flex items-center justify-center gap-1 mt-0.5 w-full">
                <button
                  type="button"
                  onClick={() => handleQuickWeightAdjust(-2)}
                  className="h-4 w-4 rounded-full flex items-center justify-center text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors leading-none"
                  title="-2kg"
                >
                  -
                </button>
                <span className="font-bold text-xs sm:text-sm text-foreground">
                  {exercise.weightKg ? `${exercise.weightKg}k` : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickWeightAdjust(2)}
                  className="h-4 w-4 rounded-full flex items-center justify-center text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors leading-none"
                  title="+2kg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Descanso com acionamento do cronômetro */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartRest(exercise.restSeconds)}
              className="h-auto p-1.5 sm:p-2 flex flex-col items-center justify-center gap-0.5 rounded-lg border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors shadow-none"
              title={`Iniciar descanso (${exercise.restSeconds}s)`}
            >
              <Timer className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold font-mono text-primary text-xs sm:text-sm">
                {exercise.restSeconds}s
              </span>
            </Button>
          </div>
        ) : (
          /* Formulário de Edição Inline */
          <div className="mt-2.5 pt-2.5 border-t space-y-2.5 animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                  Séries
                </label>
                <Input
                  type="number"
                  min={1}
                  value={sets}
                  onChange={(e) => setSets(Number(e.target.value))}
                  className="h-8 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                  Reps
                </label>
                <Input
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="h-8 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                  Carga (kg)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={weightKg === 0 ? "" : weightKg}
                  placeholder="0"
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="h-8 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                  Descanso (s)
                </label>
                <Input
                  type="number"
                  min={5}
                  value={restSeconds}
                  onChange={(e) => setRestSeconds(Number(e.target.value))}
                  className="h-8 text-xs text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                Observações
              </label>
              <Input
                value={notes}
                placeholder="Ex: Cadência controlada, foco na fase excêntrica..."
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-7 text-xs">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs gap-1 font-semibold">
                <Check className="h-3 w-3" /> Salvar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes / GIF / Instruções */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
          {(() => {
            const catalogExercise = getExerciseById(exercise.catalogId)
            const instructions =
              exercise.instructions && exercise.instructions.length > 0
                ? exercise.instructions
                : catalogExercise?.instructions || []
            const gifUrl = exercise.gifUrl || catalogExercise?.gifUrl

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default">{exercise.muscleLabel}</Badge>
                    <Badge variant="outline">{exercise.equipmentLabel}</Badge>
                  </div>
                  <DialogTitle className="text-base sm:text-lg font-bold leading-snug">
                    {exercise.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="w-full h-56 rounded-xl border bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                  {gifUrl ? (
                    <img
                      src={gifUrl}
                      alt={exercise.name}
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  ) : (
                    <Dumbbell className="h-10 w-10 text-muted-foreground/60" />
                  )}
                </div>

                {instructions.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-primary" />
                      Instruções de Execução (PT-BR)
                    </h5>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                      {instructions.map((ins, i) => (
                        <li key={i}>{ins}</li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    Execute o movimento mantendo boa postura e controle de respiração.
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDetails(false)
                      onStartRest(exercise.restSeconds)
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <Timer className="h-3.5 w-3.5 text-primary" />
                    Descanso ({exercise.restSeconds}s)
                  </Button>
                  <Button size="sm" onClick={() => setShowDetails(false)}>
                    Fechar
                  </Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}
