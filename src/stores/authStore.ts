import { create } from 'zustand'
import type { UserProfile } from '../types'
import * as authService from '../services/auth.service'
import * as profileService from '../services/profile.service'
import { supabase } from '../lib/supabase'

interface AuthState {
    user: UserProfile | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null

    initialize: () => Promise<void>
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, username: string, displayName: string) => Promise<void>
    logout: () => Promise<void>
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>
    clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    initialize: async () => {
        try {
            const session = await authService.getSession()
            if (session?.user) {
                const profile = await profileService.getProfile(session.user.id)
                set({ user: profile, isAuthenticated: true, isLoading: false })
            } else {
                set({ isLoading: false })
            }
        } catch {
            set({ isLoading: false })
        }

        // Listen for future auth changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                try {
                    const profile = await profileService.getProfile(session.user.id)
                    set({ user: profile, isAuthenticated: true })
                } catch {
                    set({ user: null, isAuthenticated: false })
                }
            } else {
                set({ user: null, isAuthenticated: false })
            }
        })
    },

    login: async (email, password) => {
        set({ error: null, isLoading: true })
        try {
            const { session } = await authService.signIn(email, password)
            if (session?.user) {
                const profile = await profileService.getProfile(session.user.id)
                set({ user: profile, isAuthenticated: true, isLoading: false })
            }
        } catch (err: any) {
            set({ error: err.message || 'Login failed', isLoading: false })
            throw err
        }
    },

    signup: async (email, password, username, displayName) => {
        set({ error: null, isLoading: true })
        try {
            await authService.signUp(email, password, username, displayName)
            // After signup, the trigger creates the profile
            // Then we sign in
            const { session } = await authService.signIn(email, password)
            if (session?.user) {
                const profile = await profileService.getProfile(session.user.id)
                set({ user: profile, isAuthenticated: true, isLoading: false })
            }
        } catch (err: any) {
            set({ error: err.message || 'Signup failed', isLoading: false })
            throw err
        }
    },

    logout: async () => {
        try {
            await authService.signOut()
        } catch {
            // ignore
        }
        set({ user: null, isAuthenticated: false })
    },

    updateProfile: async (updates) => {
        const { user } = get()
        if (!user) return
        try {
            const updated = await profileService.updateProfile(user.id, updates)
            set({ user: { ...user, ...updated } })
        } catch (err: any) {
            set({ error: err.message })
        }
    },

    clearError: () => set({ error: null }),
}))
