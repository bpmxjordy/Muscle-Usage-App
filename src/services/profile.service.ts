import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

export async function getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    if (error) throw error
    return data
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function searchUsers(query: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20)
    if (error) throw error
    return data
}
