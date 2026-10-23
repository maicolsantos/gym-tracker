import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "./firebase"
import type { WorkoutPlan, WorkoutDay, WorkoutExercise } from "./exercises/types"
import { getExerciseById } from "./exercises/catalog"

const LOCAL_STORAGE_KEY = "gym-workout-plans"
const LOCAL_STORAGE_ACTIVE_KEY = "gym-active-workout-plan-id"
export const LOCAL_STORAGE_WORKOUT_LOGS = "gym-workout-logs-by-date"

export function getWorkoutBetaAllowedUids(): Set<string> {
  const envVal = process.env.NEXT_PUBLIC_WORKOUT_BETA_ALLOWED_UIDS || ""
  return new Set(
    envVal
      .replace(/["']/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

export function isWorkoutBetaAllowed(uid?: string | null): boolean {
  if (!uid) return false
  return getWorkoutBetaAllowedUids().has(uid)
}

const ID_MIGRATIONS: Record<string, string> = {
  "pectorals/lever-pec-deck-fly": "pectorals/lever-seated-fly",
  "triceps/cable-rope-triceps-pushdown": "triceps/cable-pushdown-with-rope-attachment",
  "triceps/ez-bar-skull-crusher": "triceps/barbell-lying-triceps-extension-skull-crusher",
  "lats/lat-pulldown": "lats/cable-lat-pulldown-full-range-of-motion",
  "lats/barbell-bent-over-row": "upper-back/barbell-bent-over-row",
  "lats/cable-seated-row": "upper-back/cable-seated-row",
  "quads/barbell-squat": "quads/barbell-wide-squat",
  "quads/lever-leg-press": "quads/lever-leg-extension",
  "delts/dumbbell-shoulder-press": "delts/dumbbell-arnold-press",
}

function healExercise(ex: WorkoutExercise): WorkoutExercise {
  const targetId = ID_MIGRATIONS[ex.catalogId] || ex.catalogId
  const catalogEx = getExerciseById(targetId)
  if (catalogEx) {
    return {
      ...ex,
      catalogId: targetId,
      name: ex.name === "Voador / Peck Deck" ? "Voador / Crucifixo na Máquina" : ex.name,
      thumbUrl: catalogEx.thumbUrl,
      gifUrl: catalogEx.gifUrl,
      muscleLabel: catalogEx.muscleLabel,
      equipmentLabel: catalogEx.equipmentLabel,
      instructions:
        ex.instructions && ex.instructions.length > 0
          ? ex.instructions
          : catalogEx.instructions,
    }
  }
  return ex
}

function healPlan(plan: WorkoutPlan): WorkoutPlan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map(healExercise),
    })),
  }
}

export interface WorkoutLogEntry {
  date: string // YYYY-MM-DD
  planId: string
  planTitle: string
  dayId: string
  dayName: string
  completedAt: string // ISO
}

/**
 * Templates padrão de treinos para novos usuários
 */
export const DEFAULT_WORKOUT_TEMPLATES: Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt">[] = [
  {
    title: "Hipertrofia ABC Clássico",
    description: "Divisão clássica de 3 dias para hipertrofia e desenvolvimento muscular completo.",
    isCurrent: true,
    days: [
      {
        id: "day-a",
        name: "Treino A — Peitoral e Tríceps",
        exercises: [
          {
            id: "ex-1",
            catalogId: "pectorals/barbell-bench-press",
            name: "Supino Reto com Barra",
            muscleLabel: "Peitoral",
            equipmentLabel: "Barra",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/barbell-bench-press.thumb.webp",
            sets: 4,
            reps: "8-10",
            weightKg: 40,
            restSeconds: 90,
            notes: "Manter escápulas aduzidas e descida controlada",
          },
          {
            id: "ex-2",
            catalogId: "pectorals/dumbbell-incline-bench-press",
            name: "Supino Inclinado com Halteres",
            muscleLabel: "Peitoral",
            equipmentLabel: "Halteres",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/dumbbell-incline-bench-press.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/dumbbell-incline-bench-press.thumb.webp",
            sets: 3,
            reps: "10-12",
            weightKg: 18,
            restSeconds: 60,
          },
          {
            id: "ex-3",
            catalogId: "pectorals/lever-seated-fly",
            name: "Voador / Crucifixo na Máquina",
            muscleLabel: "Peitoral",
            equipmentLabel: "Máquina Articulada",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/lever-seated-fly.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/pectorals/lever-seated-fly.thumb.webp",
            sets: 3,
            reps: "12-15",
            weightKg: 35,
            restSeconds: 60,
          },
          {
            id: "ex-4",
            catalogId: "triceps/cable-pushdown-with-rope-attachment",
            name: "Tríceps Corda na Polia",
            muscleLabel: "Tríceps",
            equipmentLabel: "Polia",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/cable-pushdown-with-rope-attachment.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/cable-pushdown-with-rope-attachment.thumb.webp",
            sets: 4,
            reps: "10-12",
            weightKg: 20,
            restSeconds: 60,
          },
          {
            id: "ex-5",
            catalogId: "triceps/barbell-lying-triceps-extension-skull-crusher",
            name: "Tríceps Testa com Barra",
            muscleLabel: "Tríceps",
            equipmentLabel: "Barra",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/barbell-lying-triceps-extension-skull-crusher.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/triceps/barbell-lying-triceps-extension-skull-crusher.thumb.webp",
            sets: 3,
            reps: "10-12",
            weightKg: 16,
            restSeconds: 60,
          },
        ],
      },
      {
        id: "day-b",
        name: "Treino B — Costas e Bíceps",
        exercises: [
          {
            id: "ex-6",
            catalogId: "lats/cable-lat-pulldown-full-range-of-motion",
            name: "Puxada Frontal na Polia",
            muscleLabel: "Dorsais / Costas",
            equipmentLabel: "Polia",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/cable-lat-pulldown-full-range-of-motion.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/lats/cable-lat-pulldown-full-range-of-motion.thumb.webp",
            sets: 4,
            reps: "10-12",
            weightKg: 45,
            restSeconds: 90,
          },
          {
            id: "ex-7",
            catalogId: "upper-back/barbell-bent-over-row",
            name: "Remada Curvada com Barra",
            muscleLabel: "Costas",
            equipmentLabel: "Barra",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/barbell-bent-over-row.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/barbell-bent-over-row.thumb.webp",
            sets: 4,
            reps: "8-10",
            weightKg: 36,
            restSeconds: 90,
          },
          {
            id: "ex-8",
            catalogId: "upper-back/cable-seated-row",
            name: "Remada Baixa na Polia",
            muscleLabel: "Costas",
            equipmentLabel: "Polia",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/cable-seated-row.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/upper-back/cable-seated-row.thumb.webp",
            sets: 3,
            reps: "10-12",
            weightKg: 40,
            restSeconds: 60,
          },
          {
            id: "ex-9",
            catalogId: "biceps/barbell-curl",
            name: "Rosca Direta com Barra",
            muscleLabel: "Bíceps",
            equipmentLabel: "Barra",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/barbell-curl.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/barbell-curl.thumb.webp",
            sets: 4,
            reps: "10-12",
            weightKg: 18,
            restSeconds: 60,
          },
          {
            id: "ex-10",
            catalogId: "biceps/dumbbell-hammer-curl",
            name: "Rosca Martelo com Halteres",
            muscleLabel: "Bíceps",
            equipmentLabel: "Halteres",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/dumbbell-hammer-curl.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/biceps/dumbbell-hammer-curl.thumb.webp",
            sets: 3,
            reps: "12",
            weightKg: 12,
            restSeconds: 60,
          },
        ],
      },
      {
        id: "day-c",
        name: "Treino C — Pernas e Ombros",
        exercises: [
          {
            id: "ex-11",
            catalogId: "quads/barbell-wide-squat",
            name: "Agachamento Livre com Barra",
            muscleLabel: "Quadríceps",
            equipmentLabel: "Barra",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/barbell-wide-squat.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/barbell-wide-squat.thumb.webp",
            sets: 4,
            reps: "8-10",
            weightKg: 50,
            restSeconds: 120,
          },
          {
            id: "ex-12",
            catalogId: "quads/lever-leg-extension",
            name: "Cadeira Extensora",
            muscleLabel: "Quadríceps",
            equipmentLabel: "Máquina Articulada",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/lever-leg-extension.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/quads/lever-leg-extension.thumb.webp",
            sets: 4,
            reps: "10-12",
            weightKg: 45,
            restSeconds: 90,
          },
          {
            id: "ex-13",
            catalogId: "hamstrings/lever-lying-leg-curl",
            name: "Mesa Flexora",
            muscleLabel: "Posterior de Coxa",
            equipmentLabel: "Máquina Articulada",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/hamstrings/lever-lying-leg-curl.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/hamstrings/lever-lying-leg-curl.thumb.webp",
            sets: 3,
            reps: "10-12",
            weightKg: 35,
            restSeconds: 60,
          },
          {
            id: "ex-14",
            catalogId: "delts/dumbbell-lateral-raise",
            name: "Elevação Lateral com Halteres",
            muscleLabel: "Ombros (Deltoides)",
            equipmentLabel: "Halteres",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-lateral-raise.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-lateral-raise.thumb.webp",
            sets: 4,
            reps: "12-15",
            weightKg: 8,
            restSeconds: 60,
          },
          {
            id: "ex-15",
            catalogId: "delts/dumbbell-arnold-press",
            name: "Desenvolvimento Arnold com Halteres",
            muscleLabel: "Ombros (Deltoides)",
            equipmentLabel: "Halteres",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-arnold-press.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/delts/dumbbell-arnold-press.thumb.webp",
            sets: 3,
            reps: "10-12",
            weightKg: 14,
            restSeconds: 60,
          },
          {
            id: "ex-16",
            catalogId: "calves/lever-seated-calf-raise",
            name: "Panturrilha Sentado na Máquina (Gêmeos)",
            muscleLabel: "Panturrilhas",
            equipmentLabel: "Máquina Articulada",
            gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/calves/lever-seated-calf-raise.gif",
            thumbUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/calves/lever-seated-calf-raise.thumb.webp",
            sets: 4,
            reps: "15",
            weightKg: 30,
            restSeconds: 45,
          },
        ],
      },
    ],
  },
]

// --- Funções LocalStorage ---

export function getLocalWorkoutPlans(): WorkoutPlan[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WorkoutPlan[]
    const healed = parsed.map(healPlan)
    return healed
  } catch (err) {
    console.error("Erro ao ler planos locais:", err)
    return []
  }
}

export function saveLocalWorkoutPlans(plans: WorkoutPlan[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans))
  } catch (err) {
    console.error("Erro ao salvar planos locais:", err)
  }
}

export function getLocalActivePlanId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY)
}

export function setLocalActivePlanId(planId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, planId)
}

// Workout Logs por data (associação com o calendário)
export function getWorkoutLogs(): Record<string, WorkoutLogEntry> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WORKOUT_LOGS)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (err) {
    console.error("Erro ao ler logs de treino:", err)
    return {}
  }
}

export function saveWorkoutLog(entry: WorkoutLogEntry): void {
  if (typeof window === "undefined") return
  try {
    const logs = getWorkoutLogs()
    logs[entry.date] = entry
    localStorage.setItem(LOCAL_STORAGE_WORKOUT_LOGS, JSON.stringify(logs))
  } catch (err) {
    console.error("Erro ao salvar log de treino:", err)
  }
}

export const MAX_PLANS_COUNT = 5
export const MAX_DAYS_PER_PLAN = 7
export const MAX_EXERCISES_PER_DAY = 15

export const LOCAL_STORAGE_ACTIVE_SESSION = "gym-active-workout-session"
const SESSION_TTL_MS = 3 * 60 * 60 * 1000 // 3 horas

export interface ActiveWorkoutSession {
  planId: string
  dayId: string
  isStarted: boolean
  completedExerciseIds: string[]
  updatedAt: number
}

export function getActiveWorkoutSession(): ActiveWorkoutSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION)
    if (!raw) return null
    const data = JSON.parse(raw) as ActiveWorkoutSession
    if (!data || typeof data.updatedAt !== "number" || Date.now() - data.updatedAt > SESSION_TTL_MS) {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION)
      return null
    }
    return data
  } catch (err) {
    console.error("Erro ao ler sessão ativa de treino:", err)
    return null
  }
}

export function saveActiveWorkoutSession(session: Omit<ActiveWorkoutSession, "updatedAt">): void {
  if (typeof window === "undefined") return
  try {
    const toSave: ActiveWorkoutSession = {
      ...session,
      updatedAt: Date.now(),
    }
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION, JSON.stringify(toSave))
  } catch (err) {
    console.error("Erro ao salvar sessão ativa de treino:", err)
  }
}

export function clearActiveWorkoutSession(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION)
  } catch (err) {
    console.error("Erro ao limpar sessão ativa de treino:", err)
  }
}

export function removeWorkoutLog(date: string): void {
  if (typeof window === "undefined") return
  try {
    const logs = getWorkoutLogs()
    delete logs[date]
    localStorage.setItem(LOCAL_STORAGE_WORKOUT_LOGS, JSON.stringify(logs))
  } catch (err) {
    console.error("Erro ao remover log de treino:", err)
  }
}

// --- Funções Firestore ---

export async function getUserWorkoutPlans(uid: string): Promise<WorkoutPlan[]> {
  const db = getDb()
  const snap = await getDocs(collection(db, "users", uid, "workoutPlans"))
  const plans = snap.docs.map((d) => healPlan(d.data() as WorkoutPlan))

  // Se o Firestore estiver vazio, mas o usuário tiver planos no localStorage, migramos
  if (plans.length === 0) {
    const localPlans = getLocalWorkoutPlans()
    if (localPlans.length > 0) {
      await Promise.all(localPlans.map((p) => saveWorkoutPlan(uid, p)))
      return localPlans
    }
  }

  // Se estiver completamente vazio (nem local nem Firestore), inicializa com o template padrão ABC
  if (plans.length === 0) {
    const defaultTemplate = DEFAULT_WORKOUT_TEMPLATES[0]
    const now = new Date().toISOString()
    const newPlan: WorkoutPlan = {
      ...defaultTemplate,
      id: "abc-classico",
      createdAt: now,
      updatedAt: now,
    }
    await saveWorkoutPlan(uid, newPlan)
    saveLocalWorkoutPlans([newPlan])
    return [newPlan]
  }

  // Atualiza cache local
  saveLocalWorkoutPlans(plans)
  return plans
}

export function removeUndefinedFields<T>(val: T): T {
  if (val === null || val === undefined) {
    return val
  }
  if (Array.isArray(val)) {
    return val.map(removeUndefinedFields) as unknown as T
  }
  if (typeof val === "object" && val !== null) {
    const cleaned: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(val)) {
      if (v !== undefined) {
        cleaned[key] = removeUndefinedFields(v)
      }
    }
    return cleaned as T
  }
  return val
}

export async function saveWorkoutPlan(uid: string, plan: WorkoutPlan): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()
  const planToSave: WorkoutPlan = {
    ...plan,
    updatedAt: now,
  }

  const sanitized = removeUndefinedFields(planToSave)
  await setDoc(doc(db, "users", uid, "workoutPlans", plan.id), sanitized)

  // Atualiza cache local
  const currentLocal = getLocalWorkoutPlans()
  const existingIdx = currentLocal.findIndex((p) => p.id === plan.id)
  let updatedLocal: WorkoutPlan[]
  if (existingIdx >= 0) {
    updatedLocal = [...currentLocal]
    updatedLocal[existingIdx] = planToSave
  } else {
    updatedLocal = [...currentLocal, planToSave]
  }

  // Se for o ativo, desativa os outros
  if (planToSave.isCurrent) {
    updatedLocal = updatedLocal.map((p) => ({
      ...p,
      isCurrent: p.id === plan.id,
    }))
  }
  saveLocalWorkoutPlans(updatedLocal)
}

export async function deleteWorkoutPlan(uid: string, planId: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, "users", uid, "workoutPlans", planId))

  const currentLocal = getLocalWorkoutPlans().filter((p) => p.id !== planId)
  saveLocalWorkoutPlans(currentLocal)
}

export async function setActiveWorkoutPlan(uid: string, planId: string): Promise<void> {
  const db = getDb()
  const plans = await getUserWorkoutPlans(uid)
  const batch = writeBatch(db)

  for (const p of plans) {
    const isCurrent = p.id === planId
    const ref = doc(db, "users", uid, "workoutPlans", p.id)
    batch.update(ref, { isCurrent, updatedAt: new Date().toISOString() })
  }

  await batch.commit()

  // Atualiza local
  const updated = plans.map((p) => ({
    ...p,
    isCurrent: p.id === planId,
  }))
  saveLocalWorkoutPlans(updated)
  setLocalActivePlanId(planId)
}
