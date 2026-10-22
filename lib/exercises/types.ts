export interface CatalogExercise {
  id: string
  slug: string
  name: string
  originalName: string
  muscle: string
  muscleLabel: string
  equipment: string
  equipmentLabel: string
  bodyPart: string
  category: string
  secondaryMuscles: string[]
  instructions: string[]
  gifUrl: string
  thumbUrl?: string
}

export interface WorkoutExercise {
  id: string
  catalogId: string
  name: string
  muscleLabel: string
  equipmentLabel: string
  gifUrl: string
  thumbUrl?: string
  sets: number
  reps: string
  weightKg?: number
  restSeconds: number
  notes?: string
  instructions?: string[]
}

export interface WorkoutDay {
  id: string
  name: string
  exercises: WorkoutExercise[]
}

export interface WorkoutPlan {
  id: string
  title: string
  description?: string
  isCurrent: boolean
  days: WorkoutDay[]
  createdAt: string
  updatedAt: string
}

export interface ExerciseFilterOptions {
  searchQuery?: string
  muscle?: string
  equipment?: string
}
