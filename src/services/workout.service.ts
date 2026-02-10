import { supabase } from '../lib/supabase'
import type { Workout, WorkoutExercise, WorkoutSet } from '../types'
import { getExerciseById } from '../data/exercises'

// ─── Fetch all workouts for a user ──────────────────────────────────
export async function getWorkouts(userId: string): Promise<Workout[]> {
    const { data, error } = await supabase
        .from('workouts')
        .select(`
      *,
      workout_exercises (
        *,
        workout_sets (*)
      )
    `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })

    if (error) throw error

    return (data || []).map(mapDbWorkoutToWorkout)
}

// ─── Create a completed workout ─────────────────────────────────────
export async function createWorkout(
    userId: string,
    workout: {
        name: string
        started_at: string
        completed_at: string
        duration_minutes: number
        notes?: string
        mood?: number
        exercises: {
            exercise_id: string
            exercise_name: string
            order: number
            sets: { set_number: number; reps: number; weight_kg: number; rpe?: number; is_warmup: boolean; is_pr: boolean }[]
        }[]
    }
) {
    // 1. Insert workout
    const { data: workoutRow, error: wErr } = await supabase
        .from('workouts')
        .insert({
            user_id: userId,
            name: workout.name,
            started_at: workout.started_at,
            completed_at: workout.completed_at,
            duration_minutes: workout.duration_minutes,
            notes: workout.notes,
            mood: workout.mood,
        })
        .select()
        .single()

    if (wErr) throw wErr

    // 2. Insert exercises
    for (const ex of workout.exercises) {
        const { data: exRow, error: eErr } = await supabase
            .from('workout_exercises')
            .insert({
                workout_id: workoutRow.id,
                exercise_id: ex.exercise_id,
                exercise_name: ex.exercise_name,
                order: ex.order,
            })
            .select()
            .single()

        if (eErr) throw eErr

        // 3. Insert sets
        if (ex.sets.length > 0) {
            const { error: sErr } = await supabase
                .from('workout_sets')
                .insert(
                    ex.sets.map((s) => ({
                        workout_exercise_id: exRow.id,
                        set_number: s.set_number,
                        reps: s.reps,
                        weight_kg: s.weight_kg,
                        rpe: s.rpe || null,
                        is_warmup: s.is_warmup,
                        is_pr: s.is_pr,
                    }))
                )
            if (sErr) throw sErr
        }
    }

    return workoutRow.id as string
}

// ─── Delete a workout ───────────────────────────────────────────────
export async function deleteWorkout(workoutId: string) {
    const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
    if (error) throw error
}

// ─── Map DB row to app Workout type ─────────────────────────────────
function mapDbWorkoutToWorkout(row: any): Workout {
    return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        started_at: row.started_at,
        completed_at: row.completed_at,
        duration_minutes: row.duration_minutes,
        notes: row.notes,
        mood: row.mood,
        exercises: (row.workout_exercises || []).map((we: any): WorkoutExercise => ({
            id: we.id,
            exercise: getExerciseById(we.exercise_id) || {
                id: we.exercise_id,
                name: we.exercise_name,
                category: 'compound',
                equipment: '',
                primary_muscles: [],
                secondary_muscles: [],
            },
            sets: (we.workout_sets || [])
                .sort((a: any, b: any) => a.set_number - b.set_number)
                .map((s: any): WorkoutSet => ({
                    id: s.id,
                    exercise_id: we.exercise_id,
                    set_number: s.set_number,
                    reps: s.reps,
                    weight_kg: Number(s.weight_kg),
                    rpe: s.rpe,
                    is_warmup: s.is_warmup,
                    is_pr: s.is_pr,
                })),
            notes: we.notes,
        })),
    }
}
