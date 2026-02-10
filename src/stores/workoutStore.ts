import { create } from 'zustand'
import type { Workout, WorkoutExercise, WorkoutSet, Routine, PersonalRecord, MuscleGroup, MuscleUsageData } from '../types'
import * as workoutService from '../services/workout.service'
import * as routineService from '../services/routine.service'
import * as prService from '../services/pr.service'
import * as socialService from '../services/social.service'
import { getExerciseById } from '../data/exercises'

interface WorkoutState {
    // Data
    workouts: Workout[]
    routines: Routine[]
    personalRecords: PersonalRecord[]
    activeWorkout: Workout | null
    isLoading: boolean
    error: string | null

    // Data fetching
    loadUserData: (userId: string) => Promise<void>

    // Active workout (client-side only, saved to DB on completion)
    startWorkout: (name: string, userId: string) => void
    addExercise: (exerciseId: string) => void
    removeExercise: (exerciseIndex: number) => void
    addSet: (exerciseIndex: number) => void
    updateSet: (exerciseIndex: number, setIndex: number, data: Partial<WorkoutSet>) => void
    removeSet: (exerciseIndex: number, setIndex: number) => void
    completeWorkout: (userId: string) => Promise<void>
    cancelWorkout: () => void

    // Routines
    createRoutine: (userId: string, routine: Omit<Routine, 'id' | 'user_id' | 'created_at'>) => Promise<void>
    updateRoutine: (routineId: string, routine: Omit<Routine, 'id' | 'user_id' | 'created_at'>) => Promise<void>
    deleteRoutine: (routineId: string) => Promise<void>
    startFromRoutine: (routine: Routine, userId: string) => void

    // Analytics
    getMuscleUsage: (days: number) => MuscleUsageData[]
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    workouts: [],
    routines: [],
    personalRecords: [],
    activeWorkout: null,
    isLoading: false,
    error: null,

    // ─── Load all user data from Supabase ─────────────────────────────
    loadUserData: async (userId) => {
        set({ isLoading: true, error: null })
        try {
            const [workouts, routines, prs] = await Promise.all([
                workoutService.getWorkouts(userId),
                routineService.getRoutines(userId),
                prService.getPersonalRecords(userId),
            ])
            set({ workouts, routines, personalRecords: prs, isLoading: false })
        } catch (err: any) {
            set({ error: err.message, isLoading: false })
        }
    },

    // ─── Active Workout (in-memory until completion) ──────────────────
    startWorkout: (name, userId) => {
        set({
            activeWorkout: {
                id: crypto.randomUUID(),
                user_id: userId,
                name,
                started_at: new Date().toISOString(),
                exercises: [],
            },
        })
    },

    addExercise: (exerciseId) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return
        const exercise = getExerciseById(exerciseId)
        if (!exercise) return

        set({
            activeWorkout: {
                ...activeWorkout,
                exercises: [
                    ...activeWorkout.exercises,
                    {
                        id: crypto.randomUUID(),
                        exercise,
                        sets: [
                            {
                                id: crypto.randomUUID(),
                                exercise_id: exerciseId,
                                set_number: 1,
                                reps: 0,
                                weight_kg: 0,
                                is_warmup: false,
                                is_pr: false,
                            },
                        ],
                    },
                ],
            },
        })
    },

    removeExercise: (exerciseIndex) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return
        set({
            activeWorkout: {
                ...activeWorkout,
                exercises: activeWorkout.exercises.filter((_, i) => i !== exerciseIndex),
            },
        })
    },

    addSet: (exerciseIndex) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return
        const exercises = [...activeWorkout.exercises]
        const ex = exercises[exerciseIndex]
        exercises[exerciseIndex] = {
            ...ex,
            sets: [
                ...ex.sets,
                {
                    id: crypto.randomUUID(),
                    exercise_id: ex.exercise.id,
                    set_number: ex.sets.length + 1,
                    reps: 0,
                    weight_kg: 0,
                    is_warmup: false,
                    is_pr: false,
                },
            ],
        }
        set({ activeWorkout: { ...activeWorkout, exercises } })
    },

    updateSet: (exerciseIndex, setIndex, data) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return
        const exercises = [...activeWorkout.exercises]
        const sets = [...exercises[exerciseIndex].sets]
        sets[setIndex] = { ...sets[setIndex], ...data }
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets }
        set({ activeWorkout: { ...activeWorkout, exercises } })
    },

    removeSet: (exerciseIndex, setIndex) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return
        const exercises = [...activeWorkout.exercises]
        exercises[exerciseIndex] = {
            ...exercises[exerciseIndex],
            sets: exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex),
        }
        set({ activeWorkout: { ...activeWorkout, exercises } })
    },

    completeWorkout: async (userId) => {
        const { activeWorkout } = get()
        if (!activeWorkout) return

        const now = new Date()
        const started = new Date(activeWorkout.started_at)
        const durationMinutes = Math.round((now.getTime() - started.getTime()) / 60000)

        try {
            // Save to Supabase
            const workoutId = await workoutService.createWorkout(userId, {
                name: activeWorkout.name,
                started_at: activeWorkout.started_at,
                completed_at: now.toISOString(),
                duration_minutes: durationMinutes,
                exercises: activeWorkout.exercises.map((ex, i) => ({
                    exercise_id: ex.exercise.id,
                    exercise_name: ex.exercise.name,
                    order: i,
                    sets: ex.sets.map((s, j) => ({
                        set_number: j + 1,
                        reps: s.reps,
                        weight_kg: s.weight_kg,
                        rpe: s.rpe,
                        is_warmup: s.is_warmup,
                        is_pr: s.is_pr,
                    })),
                })),
            })

            // Check for PRs
            for (const ex of activeWorkout.exercises) {
                for (const s of ex.sets) {
                    if (s.reps > 0 && s.weight_kg > 0 && !s.is_warmup) {
                        const estimated1RM = s.weight_kg * (1 + s.reps / 30) // Epley formula
                        await prService.upsertPersonalRecord(userId, {
                            exercise_id: ex.exercise.id,
                            exercise_name: ex.exercise.name,
                            weight_kg: s.weight_kg,
                            reps: s.reps,
                            estimated_1rm: Math.round(estimated1RM * 10) / 10,
                            workout_id: workoutId,
                        })
                    }
                }
            }

            // Post to social feed
            const totalVolume = activeWorkout.exercises.reduce(
                (a, ex) => a + ex.sets.reduce((b, s) => b + s.reps * s.weight_kg, 0), 0
            )
            await socialService.postFeedItem(userId, {
                type: 'workout',
                title: `Completed "${activeWorkout.name}"`,
                description: `${activeWorkout.exercises.length} exercises · ${Math.round(totalVolume)}kg total volume · ${durationMinutes} min`,
                workout_id: workoutId,
            })

            // Clear active workout immediately so UI updates
            set({ activeWorkout: null })

            // Reload data from DB in background
            get().loadUserData(userId)
        } catch (err: any) {
            set({ activeWorkout: null, error: err.message })
        }
    },

    cancelWorkout: () => set({ activeWorkout: null }),

    // ─── Routines ─────────────────────────────────────────────────────
    createRoutine: async (userId, routine) => {
        try {
            await routineService.createRoutine(
                userId,
                { name: routine.name, description: routine.description, day_of_week: routine.day_of_week, is_public: routine.is_public },
                routine.exercises.map((e, i) => ({
                    exercise_id: e.exercise.id,
                    exercise_name: e.exercise.name,
                    target_sets: e.target_sets,
                    target_reps_min: e.target_reps_min,
                    target_reps_max: e.target_reps_max,
                    rest_seconds: e.rest_seconds,
                    order: i,
                }))
            )
            await get().loadUserData(userId)
        } catch (err: any) {
            set({ error: err.message })
        }
    },

    updateRoutine: async (routineId, routine) => {
        try {
            await routineService.updateRoutine(
                routineId,
                { name: routine.name, description: routine.description, day_of_week: routine.day_of_week, is_public: routine.is_public },
                routine.exercises.map((e, i) => ({
                    exercise_id: e.exercise.id,
                    exercise_name: e.exercise.name,
                    target_sets: e.target_sets,
                    target_reps_min: e.target_reps_min,
                    target_reps_max: e.target_reps_max,
                    rest_seconds: e.rest_seconds,
                    order: i,
                }))
            )
            // Reload routines
            const routines = await routineService.getRoutines(routine.exercises[0]?.exercise?.id ? get().routines[0]?.user_id || '' : '')
            set({ routines })
        } catch (err: any) {
            set({ error: err.message })
        }
    },

    deleteRoutine: async (routineId) => {
        try {
            await routineService.deleteRoutine(routineId)
            set({ routines: get().routines.filter((r) => r.id !== routineId) })
        } catch (err: any) {
            set({ error: err.message })
        }
    },

    startFromRoutine: (routine, userId) => {
        set({
            activeWorkout: {
                id: crypto.randomUUID(),
                user_id: userId,
                name: routine.name,
                started_at: new Date().toISOString(),
                exercises: routine.exercises.map((re) => ({
                    id: crypto.randomUUID(),
                    exercise: re.exercise,
                    sets: Array.from({ length: re.target_sets }, (_, i) => ({
                        id: crypto.randomUUID(),
                        exercise_id: re.exercise.id,
                        set_number: i + 1,
                        reps: 0,
                        weight_kg: 0,
                        is_warmup: false,
                        is_pr: false,
                    })),
                })),
            },
        })
    },

    // ─── Analytics ────────────────────────────────────────────────────
    getMuscleUsage: (days) => {
        const { workouts } = get()
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)

        const muscleMap = new Map<MuscleGroup, { volume: number; sets: number }>()
        const recentWorkouts = workouts.filter((w) => new Date(w.started_at) >= cutoff)

        for (const workout of recentWorkouts) {
            for (const ex of workout.exercises) {
                for (const s of ex.sets) {
                    if (s.is_warmup) continue
                    const vol = s.reps * s.weight_kg

                    for (const muscle of ex.exercise.primary_muscles) {
                        const existing = muscleMap.get(muscle) || { volume: 0, sets: 0 }
                        muscleMap.set(muscle, { volume: existing.volume + vol, sets: existing.sets + 1 })
                    }
                    for (const muscle of ex.exercise.secondary_muscles) {
                        const existing = muscleMap.get(muscle) || { volume: 0, sets: 0 }
                        muscleMap.set(muscle, { volume: existing.volume + vol * 0.5, sets: existing.sets + 1 })
                    }
                }
            }
        }

        const maxVolume = Math.max(...Array.from(muscleMap.values()).map((v) => v.volume), 1)
        const totalVolume = Array.from(muscleMap.values()).reduce((a, v) => a + v.volume, 0) || 1

        return Array.from(muscleMap.entries()).map(([muscle, data]) => ({
            muscle,
            total_volume: Math.round(data.volume),
            total_sets: data.sets,
            percentage: Math.round((data.volume / totalVolume) * 100),
            intensity: data.volume / maxVolume,
        }))
    },
}))
