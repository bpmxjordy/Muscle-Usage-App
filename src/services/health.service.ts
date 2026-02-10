import { supabase } from '../lib/supabase'
import type { DailyNutrition } from '../types'

export async function getNutritionLog(userId: string, date: string): Promise<DailyNutrition | null> {
    const { data, error } = await supabase
        .from('daily_nutrition')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data
}

export async function upsertNutrition(userId: string, date: string, nutrition: Partial<DailyNutrition>) {
    const { data, error } = await supabase
        .from('daily_nutrition')
        .upsert(
            { user_id: userId, date, ...nutrition },
            { onConflict: 'user_id,date' }
        )
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getNutritionHistory(userId: string, days: number = 30) {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const { data, error } = await supabase
        .from('daily_nutrition')
        .select('*')
        .eq('user_id', userId)
        .gte('date', fromDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

    if (error) throw error
    return data || []
}
