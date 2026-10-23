"use client"

import { useState } from "react"
import {
  Sparkles,
  Plus,
  Check,
  Edit2,
  Trash2,
  FolderOpen,
  ChevronDown,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { WorkoutPlan } from "@/lib/exercises/types"
import { DEFAULT_WORKOUT_TEMPLATES, MAX_PLANS_COUNT } from "@/lib/workouts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface WorkoutPlanListProps {
  plans: WorkoutPlan[]
  activePlan: WorkoutPlan
  onSelectPlan: (planId: string) => void
  onCreatePlan: (newPlan: WorkoutPlan) => void
  onUpdatePlan: (plan: WorkoutPlan) => void
  onDeletePlan: (planId: string) => void
}

export function WorkoutPlanList({
  plans,
  activePlan,
  onSelectPlan,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
}: WorkoutPlanListProps) {
  const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Estados de criação
  const [planTitle, setPlanTitle] = useState("")
  const [planDescription, setPlanDescription] = useState("")
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null)

  // Estados de edição
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const handleOpenEdit = () => {
    setEditTitle(activePlan.title)
    setEditDescription(activePlan.description ?? "")
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return
    const updated: WorkoutPlan = {
      ...activePlan,
      title: editTitle.trim(),
    }
    if (editDescription.trim()) {
      updated.description = editDescription.trim()
    } else {
      delete updated.description
    }
    onUpdatePlan(updated)
    setIsEditDialogOpen(false)
    toast.success("Plano de treino atualizado com sucesso!")
  }

  const handleCreate = () => {
    if (!planTitle.trim()) return

    if (plans.length >= MAX_PLANS_COUNT) {
      toast.error(`Você atingiu o limite máximo de ${MAX_PLANS_COUNT} planos de treino. Exclua um para criar outro.`)
      return
    }

    const now = new Date().toISOString()
    let initialDays = [
      {
        id: "day-a",
        name: "Treino A",
        exercises: [],
      },
    ]

    // Se selecionou um template
    if (selectedTemplateIndex !== null && DEFAULT_WORKOUT_TEMPLATES[selectedTemplateIndex]) {
      const template = DEFAULT_WORKOUT_TEMPLATES[selectedTemplateIndex]
      initialDays = JSON.parse(JSON.stringify(template.days))
    }

    const newPlan: WorkoutPlan = {
      id: "plan-" + Date.now(),
      title: planTitle.trim(),
      ...(planDescription.trim() ? { description: planDescription.trim() } : {}),
      isCurrent: true,
      days: initialDays,
      createdAt: now,
      updatedAt: now,
    }

    onCreatePlan(newPlan)
    setIsCreateDialogOpen(false)
    setPlanTitle("")
    setPlanDescription("")
    setSelectedTemplateIndex(null)
    toast.success(`Plano "${newPlan.title}" criado e ativado!`)
  }

  const isPlanLimitReached = plans.length >= MAX_PLANS_COUNT

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
          <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
              {activePlan.title}
            </h2>
            <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider py-0 px-1.5 h-4">
              Ativo
            </Badge>
          </div>
          {activePlan.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {activePlan.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSwitchDialogOpen(true)}
          className="flex-1 sm:flex-initial gap-1.5 text-xs h-8 px-2.5"
        >
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Planos ({plans.length}/{MAX_PLANS_COUNT})</span>
          <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenEdit}
          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          title="Editar plano"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>

        <Button
          size="sm"
          disabled={isPlanLimitReached}
          onClick={() => {
            if (isPlanLimitReached) {
              toast.error(`Você atingiu o limite máximo de ${MAX_PLANS_COUNT} planos. Exclua um antes de criar outro.`)
              return
            }
            setPlanTitle("")
            setPlanDescription("")
            setSelectedTemplateIndex(null)
            setIsCreateDialogOpen(true)
          }}
          className="flex-1 sm:flex-initial gap-1 text-xs h-8 px-2.5 font-semibold"
          title={isPlanLimitReached ? `Limite de ${MAX_PLANS_COUNT} planos atingido` : "Criar novo plano"}
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Novo Plano</span>
        </Button>
      </div>

      {/* Dialog Alternar Planos */}
      <Dialog open={isSwitchDialogOpen} onOpenChange={setIsSwitchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Seus Planos de Treino
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecione o plano ativo para visualização e acompanhamento de rotina.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
            {plans.map((p) => {
              const isSelected = p.id === activePlan.id
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "hover:bg-muted/40 border-border"
                  )}
                  onClick={() => {
                    onSelectPlan(p.id)
                    setIsSwitchDialogOpen(false)
                    toast.success(`Plano "${p.title}" selecionado!`)
                  }}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {p.title}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-medium">
                          Atual
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {p.days.length} dia{p.days.length > 1 ? "s" : ""} de treino (
                      {p.days.reduce((acc, d) => acc + d.exercises.length, 0)} exercícios)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {plans.length > 1 && !isSelected && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeletePlan(p.id)
                        }}
                        title="Excluir plano"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            {isPlanLimitReached ? (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Limite de {MAX_PLANS_COUNT} planos atingido
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSwitchDialogOpen(false)
                  setIsCreateDialogOpen(true)
                }}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Criar Outro Plano
              </Button>
            )}
            <Button size="sm" onClick={() => setIsSwitchDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Plano */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Criar Novo Plano de Treino
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Você pode iniciar do zero ou utilizar um modelo pré-configurado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Nome da Ficha / Plano</label>
              <Input
                placeholder="Ex: Hipertrofia ABCD, Push Pull Legs, Força 5x5..."
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Descrição ou Objetivo (opcional)</label>
              <Textarea
                placeholder="Ex: Foco em peitoral e dorsais, 4 vezes por semana..."
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Modelos prontos */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Ou use um modelo pronto como base:
              </label>
              <div className="space-y-1.5">
                {DEFAULT_WORKOUT_TEMPLATES.map((tmpl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedTemplateIndex(selectedTemplateIndex === idx ? null : idx)
                      if (!planTitle.trim()) {
                        setPlanTitle(tmpl.title)
                        setPlanDescription(tmpl.description ?? "")
                      }
                    }}
                    className={cn(
                      "p-2.5 rounded-lg border text-xs cursor-pointer transition-all",
                      selectedTemplateIndex === idx
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{tmpl.title}</span>
                      <span className="text-[10px]">{tmpl.days.length} divisões</span>
                    </div>
                    {tmpl.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {tmpl.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!planTitle.trim()}>
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Plano */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Editar Informações do Plano</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Nome do Plano</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Nome do plano"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Descrição</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Objetivo ou observações do plano"
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={!editTitle.trim()}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
