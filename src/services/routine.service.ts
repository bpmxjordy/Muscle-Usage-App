import { supabase } from '../lib/supabase'
import type { Routine, RoutineExercise } from '../types'
import { getExerciseById } from '../data/exercises'

// ─── Fetch all routines for a user ──────────────────────────────────
export async function getRoutines(userId: string): Promise<Routine[]> {
    const { data, error } = await supabase
        .from('routines')
        .select(`*, routine_exercises (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapDbRoutineToRoutine)
}

// ─── Create a routine ───────────────────────────────────────────────
export async function createRoutine(
    userId: string,
    routine: { name: string; description?: string; day_of_week?: string; is_public?: boolean },
    exercises: { exercise_id: string; exercise_name: string; target_sets: number; target_reps_min: number; target_reps_max: number; rest_seconds: number; order: number }[]
) {
    const { data: routineRow, error: rErr } = await supabase
        .from('routines')
        .insert({ user_id: userId, ...routine })
        .select()
        .single()

    if (rErr) throw rErr

    if (exercises.length > 0) {
        const { error: eErr } = await supabase
            .from('routine_exercises')
            .insert(exercises.map((e) => ({ routine_id: routineRow.id, ...e })))
        if (eErr) throw eErr
    }

    return routineRow.id as string
}

// ─── Update a routine ───────────────────────────────────────────────
export async function updateRoutine(
    routineId: string,
    routine: { name: string; description?: string; day_of_week?: string; is_public?: boolean },
    exercises: { exercise_id: string; exercise_name: string; target_sets: number; target_reps_min: number; target_reps_max: number; rest_seconds: number; order: number }[]
) {
    const { error: rErr } = await supabase
        .from('routines')
        .update({ ...routine, updated_at: new Date().toISOString() })
        .eq('id', routineId)

    if (rErr) throw rErr

    // Replace all exercises: delete old, insert new
    const { error: dErr } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routineId)
    if (dErr) throw dErr

    if (exercises.length > 0) {
        const { error: eErr } = await supabase
            .from('routine_exercises')
            .insert(exercises.map((e) => ({ routine_id: routineId, ...e })))
        if (eErr) throw eErr
    }
}

// ─── Delete a routine ───────────────────────────────────────────────
export async function deleteRoutine(routineId: string) {
    const { error } = await supabase.from('routines').delete().eq('id', routineId)
    if (error) throw error
}

// ─── Map DB row to app type ─────────────────────────────────────────
function mapDbRoutineToRoutine(row: any): Routine {
    return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        day_of_week: row.day_of_week,
        is_public: row.is_public,
        created_at: row.created_at,
        exercises: (row.routine_exercises || [])
            .sort((a: any, b: any) => a.order - b.order)
            .map((re: any): RoutineExercise => ({
                exercise: getExerciseById(re.exercise_id) || {
                    id: re.exercise_id,
                    name: re.exercise_name,
                    category: 'compound',
                    equipment: '',
                    primary_muscles: [],
                    secondary_muscles: [],
                },
                target_sets: re.target_sets,
                target_reps_min: re.target_reps_min,
                target_reps_max: re.target_reps_max,
                rest_seconds: re.rest_seconds,
                order: re.order,
            })),
    }
}
