"use client"

import { useState, useMemo } from "react"
import { Search, X, Dumbbell, Sparkles, Plus, ArrowLeft, Check, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { searchExercises, getMuscleGroups } from "@/lib/exercises/catalog"
import type { CatalogExercise, WorkoutExercise } from "@/lib/exercises/types"
import { cn } from "@/lib/utils"

interface ExercisePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddExercise?: (exercise: WorkoutExercise) => void
  onAddExercises?: (exercises: WorkoutExercise[]) => void
  existingCatalogIds?: string[]
  dayName?: string
}

interface PickerItemProps {
  exercise: CatalogExercise
  isAlreadyInWorkout: boolean
  isSelected: boolean
  onToggleSelect: (exercise: CatalogExercise) => void
  onConfigure: (exercise: CatalogExercise) => void
}

function PickerExerciseItem({
  exercise,
  isAlreadyInWorkout,
  isSelected,
  onToggleSelect,
  onConfigure,
}: PickerItemProps) {
  const [imgError, setImgError] = useState(false)
  const imageSrc = !imgError ? (exercise.thumbUrl || exercise.gifUrl) : null

  return (
    <div
      onClick={() => onToggleSelect(exercise)}
      className={cn(
        "group flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left cursor-pointer relative",
        // Já no treino: borda da cor do botão primário!
        isAlreadyInWorkout && !isSelected && "border-primary bg-primary/5 hover:border-primary ring-1 ring-primary/30",
        // Selecionado para adicionar agora
        isSelected && "border-primary bg-primary/10 ring-2 ring-primary shadow-sm",
        // Padrão
        !isAlreadyInWorkout && !isSelected && "border-border/60 hover:border-primary/50 hover:bg-accent/40"
      )}
    >
      {/* Miniatura WebP com Fallback e atalho de visualização */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onConfigure(exercise)
        }}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative border group/thumb cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
        title="Ver animação e instruções"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={exercise.name}
            className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Dumbbell className="h-5 w-5 text-muted-foreground/60" />
        )}
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
          <Info className="h-3.5 w-3.5 text-white" />
        </div>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 leading-tight">
            {exercise.muscleLabel}
          </span>
          {isAlreadyInWorkout && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary text-primary-foreground leading-tight">
              ✓ No treino
            </span>
          )}
        </div>

        <h4 className="text-xs sm:text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors">
          {exercise.name}
        </h4>
        <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
          {exercise.equipmentLabel}
        </span>
      </div>

      {/* Botões de Ação na Direita */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onConfigure(exercise)
          }}
          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
          title="Ver detalhes e instruções"
        >
          <Info className="h-3.5 w-3.5" />
        </button>

        <div
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center border transition-all",
            isSelected
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : isAlreadyInWorkout
              ? "bg-primary/20 text-primary border-primary/50"
              : "bg-muted text-muted-foreground border-border/80 group-hover:border-primary group-hover:text-primary"
          )}
        >
          {isSelected ? (
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          ) : isAlreadyInWorkout ? (
            <Check className="h-3.5 w-3.5 stroke-[2]" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </div>
      </div>
    </div>
  )
}

export function ExercisePickerDialog({
  open,
  onOpenChange,
  onAddExercise,
  onAddExercises,
  existingCatalogIds,
  dayName,
}: ExercisePickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null)
  const [selectedExercisesMap, setSelectedExercisesMap] = useState<Map<string, CatalogExercise>>(new Map())

  const existingSet = useMemo(() => new Set(existingCatalogIds || []), [existingCatalogIds])

  // Campos de configuração do exercício selecionado
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState("10-12")
  const [weightKg, setWeightKg] = useState<number>(0)
  const [restSeconds, setRestSeconds] = useState(60)
  const [notes, setNotes] = useState("")

  const muscleGroups = useMemo(() => getMuscleGroups(), [])

  // Top músculos mais frequentes como atalhos
  const topMuscles = useMemo(() => {
    return [
      { key: "all", label: "Todos" },
      { key: "pectorals", label: "Peitoral" },
      { key: "lats", label: "Costas" },
      { key: "delts", label: "Ombros" },
      { key: "biceps", label: "Bíceps" },
      { key: "triceps", label: "Tríceps" },
      { key: "quads", label: "Quadríceps" },
      { key: "hamstrings", label: "Posterior" },
      { key: "glutes", label: "Glúteos" },
      { key: "calves", label: "Panturrilhas" },
      { key: "abs", label: "Abdômen" },
    ]
  }, [])

  const filteredExercises = useMemo(() => {
    return searchExercises({
      searchQuery,
      muscle: selectedMuscle ?? undefined,
    }).slice(0, 40) // Limita a 40 para renderização ultra-rápida no modal
  }, [searchQuery, selectedMuscle])

  const handleToggleSelect = (exercise: CatalogExercise) => {
    setSelectedExercisesMap((prev) => {
      const next = new Map(prev)
      if (next.has(exercise.id)) {
        next.delete(exercise.id)
      } else {
        next.set(exercise.id, exercise)
      }
      return next
    })
  }

  const handleClearSelection = () => {
    setSelectedExercisesMap(new Map())
  }

  const handleConfirmBulkAdd = () => {
    const list = Array.from(selectedExercisesMap.values())
    if (list.length === 0) return

    const workoutExercises: WorkoutExercise[] = list.map((catEx, idx) => ({
      id: "ex-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).slice(2, 6),
      catalogId: catEx.id,
      name: catEx.name,
      muscleLabel: catEx.muscleLabel,
      equipmentLabel: catEx.equipmentLabel,
      gifUrl: catEx.gifUrl,
      ...(catEx.thumbUrl ? { thumbUrl: catEx.thumbUrl } : {}),
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      instructions: catEx.instructions || [],
    }))

    if (onAddExercises) {
      onAddExercises(workoutExercises)
    } else if (onAddExercise) {
      workoutExercises.forEach(onAddExercise)
    }

    setSelectedExercisesMap(new Map())
    setSelectedExercise(null)
    onOpenChange(false)
  }

  const handleSelectExercise = (exercise: CatalogExercise) => {
    setSelectedExercise(exercise)
    // Valores padrão inteligentes
    setSets(3)
    setReps("10-12")
    setWeightKg(0)
    setRestSeconds(60)
    setNotes("")
  }

  const handleConfirmAdd = () => {
    if (!selectedExercise) return

    const workoutExercise: WorkoutExercise = {
      id: "ex-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      catalogId: selectedExercise.id,
      name: selectedExercise.name,
      muscleLabel: selectedExercise.muscleLabel,
      equipmentLabel: selectedExercise.equipmentLabel,
      gifUrl: selectedExercise.gifUrl,
      ...(selectedExercise.thumbUrl ? { thumbUrl: selectedExercise.thumbUrl } : {}),
      sets: Number(sets) || 3,
      reps: reps.trim() || "10",
      ...(weightKg > 0 ? { weightKg: Number(weightKg) } : {}),
      restSeconds: Number(restSeconds) || 60,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      instructions: selectedExercise.instructions || [],
    }

    if (onAddExercises) {
      onAddExercises([workoutExercise])
    } else if (onAddExercise) {
      onAddExercise(workoutExercise)
    }
    setSelectedExercise(null)
    setSelectedExercisesMap(new Map())
    onOpenChange(false)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Se estiver na tela de detalhes/configuração do exercício, o botão "X" ou Escape
      // tem a mesma função do "Voltar à busca", mantendo a lista de exercícios e seleções abertas
      if (selectedExercise) {
        setSelectedExercise(null)
        return
      }
      setSelectedExercise(null)
      setSelectedExercisesMap(new Map())
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            {selectedExercise && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2 mr-1"
                onClick={() => setSelectedExercise(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                {selectedExercise ? "Configurar Exercício" : "Biblioteca de Exercícios"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {selectedExercise
                  ? "Defina séries, repetições e cargas para o seu treino"
                  : dayName
                  ? `Adicionar ao ${dayName}`
                  : "Explore mais de 1.300 exercícios com GIFs animados e instruções"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* View 1: Busca e Seleção */}
        {!selectedExercise && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Campo de Busca */}
            <div className="p-4 border-b space-y-3 bg-background">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, músculo ou equipamento (ex: supino, rosca, costas)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-10 text-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Chips de Músculos */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {topMuscles.map((m) => {
                  const isSelected = m.key === "all" ? !selectedMuscle : selectedMuscle === m.key
                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMuscle(m.key === "all" ? null : m.key)}
                      className={cn(
                        "px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border font-medium",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
                      )}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Lista de Resultados */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-border/40">
              {filteredExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Dumbbell className="h-10 w-10 stroke-[1.5] mb-2 opacity-40" />
                  <p className="text-sm font-medium">Nenhum exercício encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente buscar por termos mais genéricos ou selecionar outro grupo muscular.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredExercises.map((ex) => (
                    <PickerExerciseItem
                      key={ex.id}
                      exercise={ex}
                      isAlreadyInWorkout={existingSet.has(ex.id)}
                      isSelected={selectedExercisesMap.has(ex.id)}
                      onToggleSelect={handleToggleSelect}
                      onConfigure={handleSelectExercise}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Rodapé Fixo para Adição Múltipla */}
            {selectedExercisesMap.size > 0 && (
              <div className="p-3 sm:p-4 border-t bg-card/95 backdrop-blur-sm flex items-center justify-between gap-3 shadow-lg shrink-0 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs px-2.5 py-0.5 font-bold shadow-xs">
                    {selectedExercisesMap.size} selecionado{selectedExercisesMap.size > 1 ? "s" : ""}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleConfirmBulkAdd}
                  className="gap-1.5 font-bold text-xs h-9 px-4 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar {selectedExercisesMap.size > 1 ? `os ${selectedExercisesMap.size} ao Treino` : "ao Treino"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* View 2: Configuração e Detalhes do Exercício */}
        {selectedExercise && (
          <div className="flex flex-col flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Topo: GIF Animado + Título */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-48 h-48 rounded-xl border bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0 relative">
                <img
                  src={selectedExercise.gifUrl}
                  alt={selectedExercise.name}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" className="text-xs">
                    {selectedExercise.muscleLabel}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedExercise.equipmentLabel}
                  </Badge>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                  {selectedExercise.name}
                </h3>
                {selectedExercise.originalName !== selectedExercise.name && (
                  <p className="text-xs text-muted-foreground italic">
                    Original: {selectedExercise.originalName}
                  </p>
                )}

                {/* Instruções compactas */}
                {selectedExercise.instructions.length > 0 && (
                  <div className="pt-2 text-xs text-muted-foreground space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Info className="h-3 w-3 text-primary" /> Instruções de Movimento:
                    </span>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1 leading-relaxed">
                      {selectedExercise.instructions.slice(0, 3).map((ins, idx) => (
                        <li key={idx}>{ins}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Formulário de Configuração de Séries/Carga/Descanso */}
            <div className="rounded-xl border bg-card/60 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Configuração para o seu treino
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Séries */}
                <div className="space-y-1.5">
                  <Label htmlFor="sets" className="text-xs font-semibold">
                    Séries
                  </Label>
                  <div className="flex items-center border border-input rounded-md bg-transparent dark:bg-input/30 h-9 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-ring">
                    <button
                      type="button"
                      onClick={() => setSets((prev) => Math.max(1, prev - 1))}
                      className="h-full w-8 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-bold text-base select-none cursor-pointer"
                      title="Diminuir séries"
                    >
                      −
                    </button>
                    <input
                      id="sets"
                      type="number"
                      min={1}
                      max={20}
                      value={sets}
                      onChange={(e) => {
                        const val = e.target.value
                        setSets(val === "" ? 1 : Math.max(1, Number(val)))
                      }}
                      className="h-full w-full min-w-0 text-center font-bold text-sm bg-transparent border-0 outline-none px-0.5 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSets((prev) => prev + 1)}
                      className="h-full w-8 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-bold text-base select-none cursor-pointer"
                      title="Aumentar séries"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Repetições */}
                <div className="space-y-1.5">
                  <Label htmlFor="reps" className="text-xs font-semibold">
                    Repetições
                  </Label>
                  <Input
                    id="reps"
                    value={reps}
                    placeholder="Ex: 10-12 ou 8"
                    onChange={(e) => setReps(e.target.value)}
                    className="text-center font-bold text-sm h-9"
                  />
                </div>

                {/* Carga (kg) */}
                <div className="space-y-1.5">
                  <Label htmlFor="weight" className="text-xs font-semibold">
                    Carga (kg)
                  </Label>
                  <div className="flex items-center border border-input rounded-md bg-transparent dark:bg-input/30 h-9 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-ring">
                    <button
                      type="button"
                      onClick={() => setWeightKg((prev) => Math.max(0, prev - 2))}
                      className="h-full w-8 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-bold text-base select-none cursor-pointer"
                      title="Diminuir carga (-2kg)"
                    >
                      −
                    </button>
                    <input
                      id="weight"
                      type="number"
                      min={0}
                      step={1}
                      value={weightKg}
                      onChange={(e) => {
                        const val = e.target.value
                        setWeightKg(val === "" ? 0 : Math.max(0, Number(val)))
                      }}
                      className="h-full w-full min-w-0 text-center font-bold text-sm bg-transparent border-0 outline-none px-0.5 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setWeightKg((prev) => prev + 2)}
                      className="h-full w-8 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-bold text-base select-none cursor-pointer"
                      title="Aumentar carga (+2kg)"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Descanso (s) */}
                <div className="space-y-1.5">
                  <Label htmlFor="rest" className="text-xs font-semibold">
                    Descanso (s)
                  </Label>
                  <Input
                    id="rest"
                    type="number"
                    min={10}
                    step={5}
                    value={restSeconds}
                    onChange={(e) => {
                      const val = e.target.value
                      setRestSeconds(val === "" ? 10 : Math.max(0, Number(val)))
                    }}
                    className="text-center font-bold text-sm h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Observações / Notas */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
                  Observações pessoais (opcional)
                </Label>
                <Input
                  id="notes"
                  placeholder="Ex: Pegada aberta, foco na descida de 3s, drop set na última..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setSelectedExercise(null)}>
                Voltar à busca
              </Button>
              <Button onClick={handleConfirmAdd} className="gap-1.5 font-semibold">
                <Check className="h-4 w-4" />
                Adicionar ao Treino
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
