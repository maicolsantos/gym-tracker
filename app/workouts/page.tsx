"use client"

import { Button } from "@/components/ui/button"
import { RestTimer } from "@/components/workouts/rest-timer"
import { WorkoutDayView } from "@/components/workouts/workout-day-view"
import { WorkoutPlanList } from "@/components/workouts/workout-plan-list"
import { useAuth } from "@/contexts/auth-context"
import type { WorkoutPlan } from "@/lib/exercises/types"
import { getDb } from "@/lib/firebase"
import {
  deleteWorkoutPlan,
  getUserWorkoutPlans,
  isWorkoutBetaAllowed,
  saveLocalWorkoutPlans,
  saveWorkoutPlan,
  setActiveWorkoutPlan,
  MAX_PLANS_COUNT,
} from "@/lib/workouts"
import { awardWorkoutXp } from "@/lib/xp"
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { CalendarCheck, Dumbbell, Lock, Sparkles, Timer } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth()
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null)
  const [showRestTimer, setShowRestTimer] = useState(false)

  // Carrega os planos do usuário (apenas se for usuário beta autorizado)
  useEffect(() => {
    if (authLoading) return
    if (!isWorkoutBetaAllowed(user?.uid)) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function loadPlans() {
      setLoading(true)
      try {
        if (user) {
          const userPlans = await getUserWorkoutPlans(user.uid)
          if (isMounted) {
            setPlans(userPlans)
            const current = userPlans.find((p) => p.isCurrent) || userPlans[0]
            setActivePlanId(current?.id ?? null)
          }
        }
      } catch (err) {
        console.error("Erro ao carregar fichas de treino:", err)
        toast.error("Não foi possível carregar os treinos.")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPlans()

    return () => {
      isMounted = false
    }
  }, [user, authLoading])

  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0]

  const handleSelectPlan = async (planId: string) => {
    setActivePlanId(planId)
    if (user) {
      try {
        await setActiveWorkoutPlan(user.uid, planId)
      } catch (err) {
        console.error("Erro ao ativar plano:", err)
      }
    } else {
      const updated = plans.map((p) => ({ ...p, isCurrent: p.id === planId }))
      setPlans(updated)
      saveLocalWorkoutPlans(updated)
    }
  }

  const handleCreatePlan = async (newPlan: WorkoutPlan) => {
    if (plans.length >= MAX_PLANS_COUNT) {
      toast.error(`Você atingiu o limite máximo de ${MAX_PLANS_COUNT} planos.`)
      return
    }

    const updatedPlans = [...plans.map((p) => ({ ...p, isCurrent: false })), newPlan]
    setPlans(updatedPlans)
    setActivePlanId(newPlan.id)

    if (user) {
      try {
        await saveWorkoutPlan(user.uid, newPlan)
        await setActiveWorkoutPlan(user.uid, newPlan.id)
      } catch (err) {
        console.error("Erro ao salvar novo plano no Firestore:", err)
        toast.error("Erro ao sincronizar com o banco de dados.")
      }
    } else {
      saveLocalWorkoutPlans(updatedPlans)
    }
  }

  const handleUpdatePlan = async (updatedPlan: WorkoutPlan) => {
    const updatedPlans = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    setPlans(updatedPlans)

    if (user) {
      try {
        await saveWorkoutPlan(user.uid, updatedPlan)
      } catch (err) {
        console.error("Erro ao atualizar plano no Firestore:", err)
      }
    } else {
      saveLocalWorkoutPlans(updatedPlans)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (plans.length <= 1) {
      toast.error("Você precisa manter pelo menos um plano cadastrado.")
      return
    }

    const updatedPlans = plans.filter((p) => p.id !== planId)
    setPlans(updatedPlans)

    const nextActiveId = activePlanId === planId ? (updatedPlans[0]?.id ?? null) : activePlanId
    if (activePlanId === planId) {
      setActivePlanId(nextActiveId)
    }

    if (user) {
      try {
        await deleteWorkoutPlan(user.uid, planId)
        if (activePlanId === planId && nextActiveId) {
          await setActiveWorkoutPlan(user.uid, nextActiveId)
        }
        toast.success("Plano excluído.")
      } catch (err) {
        console.error("Erro ao excluir plano no Firestore:", err)
        toast.error("Falha ao excluir no banco de dados.")
      }
    } else {
      saveLocalWorkoutPlans(updatedPlans)
      toast.success("Plano excluído.")
    }
  }

  const handleStartRest = (seconds: number) => {
    setShowRestTimer(true)
    setActiveRestSeconds(seconds)
  }

  const handleWorkoutCompleted = async (date: string, dayName: string) => {
    if (user) {
      const docRef = doc(getDb(), "workouts", user.uid)
      try {
        const snap = await getDoc(docRef)
        const currentDates: string[] = snap.exists() ? (snap.data().dates as string[]) || [] : []
        const alreadyExists = currentDates.includes(date)

        if (!alreadyExists) {
          try {
            await updateDoc(docRef, {
              dates: arrayUnion(date),
            })
          } catch {
            await setDoc(docRef, { dates: [date] }, { merge: true })
          }
          awardWorkoutXp(user.uid, date).catch((err) =>
            console.error("Erro ao creditar XP:", err)
          )
        }
      } catch (err) {
        console.error("Erro ao registrar presença no Firestore:", err)
      }
    }

    // Mantém cache local de datas sincronizado
    try {
      const raw = localStorage.getItem("gym-workout-dates")
      const dates: string[] = raw ? JSON.parse(raw) : []
      if (!dates.includes(date)) {
        dates.push(date)
        localStorage.setItem("gym-workout-dates", JSON.stringify(dates))
      }
    } catch (err) {
      console.error("Erro ao salvar data local:", err)
    }
  }

  // Carregando autenticação
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  // Se o usuário não estiver na lista de permissão do beta
  if (!isWorkoutBetaAllowed(user?.uid)) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border bg-card p-6 text-center space-y-4 shadow-sm animate-in fade-in">
          <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">Funcionalidade em Beta Fechado</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O gerenciador de Treinos está em fase restrita de testes para contas selecionadas.
            </p>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* Título da Página e Descrição */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Meus Treinos
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Organize suas divisões e controle cargas, repetições e descanso.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!showRestTimer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRestTimer(true)}
                className="gap-1.5 text-xs h-8"
              >
                <Timer className="h-3.5 w-3.5 text-primary" />
                Abrir Cronômetro
              </Button>
            )}
          </div>
        </div>

        {/* Layout Grid: Treinos + Cronômetro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Coluna Principal: Ficha e Exercícios */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="rounded-xl border p-8 space-y-4 animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-32 bg-muted/50 rounded-xl" />
              </div>
            ) : !activePlan ? (
              <div className="rounded-xl border p-8 text-center bg-card">
                <p className="text-sm text-muted-foreground">Nenhum plano ativo encontrado.</p>
              </div>
            ) : (
              <>
                {/* Seletor / Gerenciador de Planos */}
                <WorkoutPlanList
                  plans={plans}
                  activePlan={activePlan}
                  onSelectPlan={handleSelectPlan}
                  onCreatePlan={handleCreatePlan}
                  onUpdatePlan={handleUpdatePlan}
                  onDeletePlan={handleDeletePlan}
                />

                {/* Visualizador de Dias e Exercícios */}
                <WorkoutDayView
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                  onStartRest={handleStartRest}
                  onWorkoutCompleted={handleWorkoutCompleted}
                />
              </>
            )}
          </div>

          {/* Coluna Lateral Desktop: Cronômetro de Descanso & Dicas */}
          <div className="hidden lg:block space-y-4 lg:sticky lg:top-20">
            {showRestTimer && (
              <RestTimer
                activeRestSeconds={activeRestSeconds}
                onClose={() => setShowRestTimer(false)}
              />
            )}

            {/* Card informativo de motivação / atalhos */}
            <div className="rounded-xl border bg-card p-4 space-y-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Dica de Performance
              </span>
              <p className="leading-relaxed">
                Mantenha de <strong>60 a 90 segundos</strong> de descanso para exercícios compostos
                e <strong>45 a 60 segundos</strong> para exercícios isolados.
              </p>
              <div className="pt-2 border-t flex items-center justify-between text-[11px] font-medium text-foreground">
                <span className="flex items-center gap-1">
                  <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Sincronizado com Calendário
                </span>
                <span className="text-primary font-bold">+50 XP / dia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Versão Mobile do Cronômetro: Barra Flutuante Fixa quando Ativo */}
        <div className="block lg:hidden">
          {showRestTimer && (
            <RestTimer
              isFloating={true}
              activeRestSeconds={activeRestSeconds}
              onClose={() => setShowRestTimer(false)}
            />
          )}
        </div>
      </main>
    </div>
  )
}
