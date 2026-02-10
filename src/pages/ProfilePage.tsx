import { useAuthStore } from '../stores/authStore'
import { useWorkoutStore } from '../stores/workoutStore'
import { User, Mail, Calendar, Dumbbell, Award, TrendingUp, LogOut, Save, Camera, Loader2, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
    const { user, updateProfile, logout } = useAuthStore()
    const { workouts, personalRecords } = useWorkoutStore()
    const navigate = useNavigate()
    const [displayName, setDisplayName] = useState(user?.display_name || '')
    const [username, setUsername] = useState(user?.username || '')
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const totalVolume = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.reduce((c, s) => c + s.reps * s.weight_kg, 0), 0), 0)
    const inputClass = "w-full px-4 py-2.5 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setUploading(true)
        try {
            const ext = file.name.split('.').pop()
            const path = `avatars/${user.id}.${ext}`

            // Upload to Supabase Storage
            const { error: uploadErr } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true })

            if (uploadErr) throw uploadErr

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(path)

            // Update profile
            await updateProfile({ avatar_url: urlData.publicUrl })
        } catch (err) {
            console.error('Upload failed:', err)
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        try {
            await updateProfile({ display_name: displayName, username })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Avatar & Name */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="relative inline-block">
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="w-24 h-24 rounded-full object-cover shadow-xl shadow-primary/20 border-2 border-primary/30"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-primary/20">
                            {user?.display_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:brightness-110 transition disabled:opacity-50"
                        title="Change profile photo"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                    />
                </div>
                <h1 className="text-2xl font-bold mt-4">{user?.display_name}</h1>
                <p className="text-text-muted">@{user?.username}</p>
                <p className="text-xs text-text-muted mt-1">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: Dumbbell, label: 'Workouts', value: workouts.length },
                    { icon: Award, label: 'PRs', value: personalRecords.length },
                    { icon: TrendingUp, label: 'Volume', value: `${(totalVolume / 1000).toFixed(1)}t` },
                ].map((s) => (
                    <div key={s.label} className="bg-surface border border-border rounded-2xl p-4 text-center">
                        <s.icon className="w-5 h-5 mx-auto mb-2 text-primary-light" />
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-xs text-text-muted">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Edit Profile */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold">Edit Profile</h2>
                <div>
                    <label className="text-xs text-text-muted mb-1 block">Display Name</label>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className="text-xs text-text-muted mb-1 block">Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className="text-xs text-text-muted mb-1 block">Email</label>
                    <input type="email" value={user?.email || ''} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:brightness-110 transition disabled:opacity-50"
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><Check className="w-4 h-4" /> Saved!</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Changes</>
                    )}
                </button>
            </div>

            {/* Logout */}
            <button onClick={() => { logout(); navigate('/login') }} className="w-full py-3 rounded-xl bg-danger/10 text-danger font-medium text-sm flex items-center justify-center gap-2 hover:bg-danger/20 transition">
                <LogOut className="w-4 h-4" /> Sign Out
            </button>
        </div>
    )
}
