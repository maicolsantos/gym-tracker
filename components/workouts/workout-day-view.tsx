"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Dumbbell,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Play,
  Check,
  Flame,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkoutExerciseCard } from "./workout-exercise-card"
import { ExercisePickerDialog } from "./exercise-picker-dialog"
import type { WorkoutPlan, WorkoutDay, WorkoutExercise } from "@/lib/exercises/types"
import { saveWorkoutLog, getWorkoutLogs } from "@/lib/workouts"
import { getTodayDateKey } from "@/lib/date-utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface WorkoutDayViewProps {
  plan: WorkoutPlan
  onUpdatePlan: (updatedPlan: WorkoutPlan) => void
  onStartRest: (seconds: number) => void
  onWorkoutCompleted?: (date: string, dayName: string) => void
}

export function WorkoutDayView({
  plan,
  onUpdatePlan,
  onStartRest,
  onWorkoutCompleted,
}: WorkoutDayViewProps) {
  const [selectedDayId, setSelectedDayId] = useState<string>(() => {
    return plan.days[0]?.id ?? ""
  })
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isNewDayDialogOpen, setIsNewDayDialogOpen] = useState(false)
  const [dayNameToEdit, setDayNameToEdit] = useState("")
  const [newDayName, setNewDayName] = useState("")

  // Estados de sessão do treino
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false)
  const [isWorkoutCompletedToday, setIsWorkoutCompletedToday] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Garante que se o dia selecionado for removido ou o plano mudar, seleciona um dia válido
  useEffect(() => {
    if (plan.days.length > 0 && !plan.days.some((d) => d.id === selectedDayId)) {
      setSelectedDayId(plan.days[0].id)
    }
  }, [plan.id, plan.days, selectedDayId])

  const activeDayIndex = Math.max(
    0,
    plan.days.findIndex((d) => d.id === selectedDayId)
  )
  const activeDay = plan.days[activeDayIndex] || plan.days[0]

  // Checa se o treino de hoje já foi feito para este dia
  useEffect(() => {
    if (typeof window === "undefined" || !activeDay) return
    const today = getTodayDateKey()
    const logs = getWorkoutLogs()
    if (logs[today]?.dayId === activeDay.id) {
      setIsWorkoutCompletedToday(true)
    } else {
      setIsWorkoutCompletedToday(false)
    }
  }, [activeDay?.id])

  // Cronômetro do treino em andamento
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isWorkoutStarted) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      setElapsedSeconds(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isWorkoutStarted])

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleStartWorkout = () => {
    setIsWorkoutStarted(true)
    toast.success("Treino iniciado! Bom treino 💪🔥", {
      description: "Ao finalizar suas séries, clique em 'Concluir'.",
    })
  }

  const handleSelectDay = (dayId: string) => {
    setSelectedDayId(dayId)
  }

  const handleAddDay = () => {
    const trimmed = newDayName.trim()
    if (!trimmed) return

    const dayLetter = String.fromCharCode(65 + plan.days.length) // A, B, C, D...
    const newDay: WorkoutDay = {
      id: "day-" + Date.now(),
      name: trimmed.startsWith("Treino") ? trimmed : `Treino ${dayLetter} — ${trimmed}`,
      exercises: [],
    }

    const updatedPlan: WorkoutPlan = {
      ...plan,
      days: [...plan.days, newDay],
    }

    onUpdatePlan(updatedPlan)
    setSelectedDayId(newDay.id)
    setNewDayName("")
    setIsNewDayDialogOpen(false)
    toast.success(`Divisão "${newDay.name}" criada com sucesso!`)
  }

  const handleRenameDay = () => {
    if (!activeDay || !dayNameToEdit.trim()) return

    const updatedDays = plan.days.map((d) =>
      d.id === activeDay.id ? { ...d, name: dayNameToEdit.trim() } : d
    )

    onUpdatePlan({ ...plan, days: updatedDays })
    setIsRenameDialogOpen(false)
    toast.success("Nome do treino atualizado!")
  }

  const handleDeleteDay = (dayId: string) => {
    if (plan.days.length <= 1) {
      toast.error("O plano deve ter pelo menos um dia de treino.")
      return
    }

    const updatedDays = plan.days.filter((d) => d.id !== dayId)
    onUpdatePlan({ ...plan, days: updatedDays })

    if (selectedDayId === dayId) {
      setSelectedDayId(updatedDays[0]?.id ?? "")
    }
    toast.success("Dia de treino removido.")
  }

  const handleAddExercisesToActiveDay = (newExercises: WorkoutExercise[]) => {
    if (!activeDay || newExercises.length === 0) return

    const updatedDays = plan.days.map((d) =>
      d.id === activeDay.id
        ? { ...d, exercises: [...d.exercises, ...newExercises] }
        : d
    )

    onUpdatePlan({ ...plan, days: updatedDays })
    toast.success(
      newExercises.length === 1
        ? `${newExercises[0].name} adicionado ao treino!`
        : `${newExercises.length} exercícios adicionados ao treino!`
    )
  }

  const handleUpdateExercise = (exerciseIndex: number, updatedExercise: WorkoutExercise) => {
    if (!activeDay) return

    const updatedExercises = [...activeDay.exercises]
    updatedExercises[exerciseIndex] = updatedExercise

    const updatedDays = plan.days.map((d) =>
      d.id === activeDay.id ? { ...d, exercises: updatedExercises } : d
    )

    onUpdatePlan({ ...plan, days: updatedDays })
  }

  const handleRemoveExercise = (exerciseIndex: number) => {
    if (!activeDay) return

    const removedName = activeDay.exercises[exerciseIndex]?.name
    const updatedExercises = activeDay.exercises.filter((_, idx) => idx !== exerciseIndex)

    const updatedDays = plan.days.map((d) =>
      d.id === activeDay.id ? { ...d, exercises: updatedExercises } : d
    )

    onUpdatePlan({ ...plan, days: updatedDays })
    toast.info(`${removedName || "Exercício"} removido.`)
  }

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    if (!activeDay) return
    if (toIndex < 0 || toIndex >= activeDay.exercises.length) return

    const updatedExercises = [...activeDay.exercises]
    const [moved] = updatedExercises.splice(fromIndex, 1)
    updatedExercises.splice(toIndex, 0, moved)

    const updatedDays = plan.days.map((d) =>
      d.id === activeDay.id ? { ...d, exercises: updatedExercises } : d
    )

    onUpdatePlan({ ...plan, days: updatedDays })
  }

  const handleLogWorkoutToday = () => {
    if (!activeDay) return
    const today = getTodayDateKey()

    saveWorkoutLog({
      date: today,
      planId: plan.id,
      planTitle: plan.title,
      dayId: activeDay.id,
      dayName: activeDay.name,
      completedAt: new Date().toISOString(),
    })

    setIsWorkoutStarted(false)
    setIsWorkoutCompletedToday(true)

    if (onWorkoutCompleted) {
      onWorkoutCompleted(today, activeDay.name)
    }

    toast.success(`Parabéns! ${activeDay.name} registrado no calendário de hoje! 💪🔥`, {
      description: "Sua frequência e pontuação foram atualizadas.",
    })
  }

  if (!activeDay) {
    return (
      <div className="rounded-xl border p-8 text-center bg-card">
        <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold">Nenhum dia de treino cadastrado</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Crie seu primeiro dia (ex: Treino A — Peito e Tríceps).
        </p>
        <Button onClick={() => setIsNewDayDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Adicionar Dia de Treino
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Abas dos Dias de Treino (Treino A, Treino B, Treino C...) */}
      <div className="flex items-center justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {plan.days.map((day) => {
            const isSelected = day.id === activeDay.id
            const exerciseCount = day.exercises.length
            return (
              <button
                key={day.id}
                onClick={() => handleSelectDay(day.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                )}
              >
                <span>{day.name}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {exerciseCount}
                </span>
              </button>
            )
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNewDayDialogOpen(true)}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground border border-dashed rounded-lg"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Novo Dia
          </Button>
        </div>
      </div>

      {/* Cabeçalho do Dia Ativo + Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-3 sm:p-4 rounded-xl border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                {activeDay.name}
              </h3>
              {isWorkoutStarted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Em andamento ({formatElapsed(elapsedSeconds)})
                </span>
              )}
              {isWorkoutCompletedToday && !isWorkoutStarted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ✓ Concluído hoje
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeDay.exercises.length === 0
                ? "Nenhum exercício neste treino ainda"
                : `${activeDay.exercises.length} exercício${
                    activeDay.exercises.length > 1 ? "s" : ""
                  } configurado${activeDay.exercises.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setDayNameToEdit(activeDay.name)
                    setIsRenameDialogOpen(true)
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-2" /> Renomear Treino
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteDay(activeDay.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir Treino
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          {/* Botão de Estado: Iniciar Treino -> Concluir Treino -> Concluído Hoje */}
          {!isWorkoutCompletedToday && !isWorkoutStarted && (
            <Button
              size="sm"
              onClick={handleStartWorkout}
              className="gap-1.5 text-xs font-semibold h-8 px-3 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Play className="h-3.5 w-3.5 fill-current shrink-0" />
              <span className="truncate">Iniciar Treino</span>
            </Button>
          )}

          {!isWorkoutCompletedToday && isWorkoutStarted && (
            <Button
              size="sm"
              onClick={handleLogWorkoutToday}
              className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 px-2.5 animate-pulse"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Concluir ({formatElapsed(elapsedSeconds)})</span>
            </Button>
          )}

          {isWorkoutCompletedToday && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogWorkoutToday}
              className="gap-1.5 text-xs font-semibold border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 h-8 px-2.5 hover:bg-emerald-500/20"
              title="Treino já concluído hoje. Clique para registrar novamente se desejar."
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Concluído Hoje ✓</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsPickerOpen(true)}
            className="gap-1.5 text-xs font-semibold h-8 px-2.5"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Exercício</span>
          </Button>

          <div className="hidden sm:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setDayNameToEdit(activeDay.name)
                    setIsRenameDialogOpen(true)
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-2" /> Renomear Treino
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteDay(activeDay.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir Treino
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Lista de Exercícios do Dia */}
      {activeDay.exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 sm:p-12 text-center bg-card/40 flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold">Nenhum exercício adicionado a este treino</h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
            Busque em nossa biblioteca de mais de 1.300 exercícios com GIFs animados de execução e monte sua ficha ideal.
          </p>
          <Button onClick={() => setIsPickerOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            Explorar e Adicionar Exercícios
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeDay.exercises.map((exercise, index) => (
            <WorkoutExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              totalCount={activeDay.exercises.length}
              onUpdate={(updated) => handleUpdateExercise(index, updated)}
              onRemove={() => handleRemoveExercise(index)}
              onMoveUp={() => handleMoveExercise(index, index - 1)}
              onMoveDown={() => handleMoveExercise(index, index + 1)}
              onStartRest={onStartRest}
            />
          ))}

          {/* Botão inferior para adicionar mais */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPickerOpen(true)}
              className="w-full border-dashed gap-1.5 text-xs h-10 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Adicionar outro exercício
            </Button>
          </div>
        </div>
      )}

      {/* Modal Seletor de Exercícios */}
      <ExercisePickerDialog
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onAddExercise={(ex) => handleAddExercisesToActiveDay([ex])}
        onAddExercises={handleAddExercisesToActiveDay}
        existingCatalogIds={activeDay.exercises.map((e) => e.catalogId)}
        dayName={activeDay.name}
      />

      {/* Dialog Renomear Dia */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Renomear Dia de Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={dayNameToEdit}
              onChange={(e) => setDayNameToEdit(e.target.value)}
              placeholder="Ex: Treino A — Peito e Tríceps"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleRenameDay}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Dia */}
      <Dialog open={isNewDayDialogOpen} onOpenChange={setIsNewDayDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Novo Dia de Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              placeholder="Ex: Treino D — Ombros e Abdômen"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewDayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddDay}>
              Criar Dia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
