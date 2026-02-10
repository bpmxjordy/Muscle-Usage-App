import { supabase } from '../lib/supabase'
import type { PersonalRecord } from '../types'

// ─── Fetch PRs ──────────────────────────────────────────────────────
export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapDbPR)
}

// ─── Upsert PR ──────────────────────────────────────────────────────
export async function upsertPersonalRecord(
    userId: string,
    pr: {
        exercise_id: string
        exercise_name: string
        weight_kg: number
        reps: number
        estimated_1rm: number
        workout_id?: string
    }
) {
    // Check if a PR already exists for this exercise
    const { data: existing } = await supabase
        .from('personal_records')
        .select('id, estimated_1rm')
        .eq('user_id', userId)
        .eq('exercise_id', pr.exercise_id)
        .single()

    if (existing && existing.estimated_1rm >= pr.estimated_1rm) {
        return null // Not a new PR
    }

    if (existing) {
        // Update existing PR
        const { data, error } = await supabase
            .from('personal_records')
            .update({
                weight_kg: pr.weight_kg,
                reps: pr.reps,
                estimated_1rm: pr.estimated_1rm,
                achieved_at: new Date().toISOString(),
                workout_id: pr.workout_id || null,
            })
            .eq('id', existing.id)
            .select()
            .single()
        if (error) throw error
        return mapDbPR(data)
    } else {
        // Insert new PR
        const { data, error } = await supabase
            .from('personal_records')
            .insert({
                user_id: userId,
                exercise_id: pr.exercise_id,
                exercise_name: pr.exercise_name,
                weight_kg: pr.weight_kg,
                reps: pr.reps,
                estimated_1rm: pr.estimated_1rm,
                workout_id: pr.workout_id || null,
            })
            .select()
            .single()
        if (error) throw error
        return mapDbPR(data)
    }
}

function mapDbPR(row: any): PersonalRecord {
    return {
        id: row.id,
        user_id: row.user_id,
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        weight_kg: Number(row.weight_kg),
        reps: row.reps,
        estimated_1rm: Number(row.estimated_1rm),
        achieved_at: row.achieved_at,
    }
}
