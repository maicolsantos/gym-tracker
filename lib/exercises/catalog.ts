import rawExercises from "@/data/exercises/exercises-pt-br.json"
import type { CatalogExercise, ExerciseFilterOptions } from "./types"

const exercises: CatalogExercise[] = rawExercises as CatalogExercise[]

// Index por ID para lookup O(1)
const exerciseById = new Map<string, CatalogExercise>()
for (const ex of exercises) {
  exerciseById.set(ex.id, ex)
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

// Pre-computa strings de busca para performance instantânea
interface SearchableExercise {
  exercise: CatalogExercise
  searchCorpus: string
}

const searchableExercises: SearchableExercise[] = exercises.map((ex) => ({
  exercise: ex,
  searchCorpus: normalize(
    `${ex.name} ${ex.originalName} ${ex.muscleLabel} ${ex.muscle} ${ex.equipmentLabel} ${ex.equipment}`
  ),
}))

export function getAllExercises(): CatalogExercise[] {
  return exercises
}

export function getExerciseById(id: string): CatalogExercise | undefined {
  return exerciseById.get(id)
}

export function searchExercises(options: ExerciseFilterOptions): CatalogExercise[] {
  const { searchQuery, muscle, equipment } = options

  const tokens = searchQuery
    ? normalize(searchQuery.trim())
        .split(/\s+/)
        .filter(Boolean)
    : []

  return searchableExercises
    .filter(({ exercise, searchCorpus }) => {
      if (muscle && exercise.muscle !== muscle) {
        return false
      }
      if (equipment && exercise.equipment !== equipment) {
        return false
      }
      if (tokens.length > 0) {
        for (const token of tokens) {
          if (!searchCorpus.includes(token)) {
            return false
          }
        }
      }
      return true
    })
    .map((item) => item.exercise)
}

export interface FilterOption {
  key: string
  label: string
  count: number
}

export function getMuscleGroups(): FilterOption[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const ex of exercises) {
    const existing = counts.get(ex.muscle)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(ex.muscle, { label: ex.muscleLabel, count: 1 })
    }
  }

  return Array.from(counts.entries())
    .map(([key, data]) => ({
      key,
      label: data.label,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
}

export function getEquipmentList(): FilterOption[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const ex of exercises) {
    const existing = counts.get(ex.equipment)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(ex.equipment, { label: ex.equipmentLabel, count: 1 })
    }
  }

  return Array.from(counts.entries())
    .map(([key, data]) => ({
      key,
      label: data.label,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
}
