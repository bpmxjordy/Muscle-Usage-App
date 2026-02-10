// ─── User ────────────────────────────────────────────────────────────────
export interface UserProfile {
    id: string
    email: string
    username: string
    display_name: string
    avatar_url?: string
    height_cm?: number
    weight_kg?: number
    age?: number
    gender?: 'male' | 'female' | 'other'
    activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
    created_at: string
}

// ─── Muscles ─────────────────────────────────────────────────────────────
export type MuscleGroup =
    | 'chest' | 'front_delts' | 'side_delts' | 'rear_delts'
    | 'biceps' | 'triceps' | 'forearms'
    | 'upper_back' | 'lats' | 'lower_back'
    | 'abs' | 'obliques'
    | 'glutes' | 'quads' | 'hamstrings' | 'calves'
    | 'traps' | 'neck'

// ─── Exercises ───────────────────────────────────────────────────────────
export interface Exercise {
    id: string
    name: string
    category: 'compound' | 'isolation'
    equipment: string
    primary_muscles: MuscleGroup[]
    secondary_muscles: MuscleGroup[]
    instructions?: string
    image_url?: string
}

// ─── Workout Logging ─────────────────────────────────────────────────────
export interface WorkoutSet {
    id: string
    exercise_id: string
    set_number: number
    reps: number
    weight_kg: number
    rpe?: number // Rate of Perceived Exertion (1-10)
    is_warmup: boolean
    is_pr: boolean
}

export interface WorkoutExercise {
    id: string
    exercise: Exercise
    sets: WorkoutSet[]
    notes?: string
}

export interface Workout {
    id: string
    user_id: string
    name: string
    started_at: string
    completed_at?: string
    duration_minutes?: number
    exercises: WorkoutExercise[]
    notes?: string
    mood?: 1 | 2 | 3 | 4 | 5
}

// ─── Routines ────────────────────────────────────────────────────────────
export interface RoutineExercise {
    exercise: Exercise
    target_sets: number
    target_reps_min: number
    target_reps_max: number
    rest_seconds: number
    order: number
}

export interface Routine {
    id: string
    user_id: string
    name: string
    description?: string
    day_of_week?: string
    exercises: RoutineExercise[]
    is_public: boolean
    created_at: string
}

// ─── Personal Records ────────────────────────────────────────────────────
export interface PersonalRecord {
    id: string
    user_id: string
    exercise_id: string
    exercise_name: string
    weight_kg: number
    reps: number
    estimated_1rm: number
    achieved_at: string
}

// ─── Social ──────────────────────────────────────────────────────────────
export interface FeedItem {
    id: string
    user: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url'>
    type: 'workout' | 'pr' | 'routine'
    content: {
        title: string
        description: string
        stats?: Record<string, string | number>
    }
    likes: number
    comments: number
    created_at: string
}

// ─── Health ──────────────────────────────────────────────────────────────
export interface DailyNutrition {
    id: string
    user_id: string
    date: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    water_ml: number
}

export interface HealthMetrics {
    bmi: number
    bmr: number
    tdee: number
    recommended_calories: number
    recommended_protein_g: number
    recommended_carbs_g: number
    recommended_fat_g: number
}

// ─── AI / Analytics ──────────────────────────────────────────────────────
export interface MuscleUsageData {
    muscle: MuscleGroup
    total_volume: number // sets * reps * weight
    total_sets: number
    percentage: number
    intensity: number // 0-1 for heatmap color
}

export interface AISuggestion {
    id: string
    type: 'exercise' | 'routine' | 'recovery' | 'nutrition'
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    reasoning: string
}
