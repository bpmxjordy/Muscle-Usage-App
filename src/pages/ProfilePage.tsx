import { useAuthStore } from '../stores/authStore'
import { useWorkoutStore } from '../stores/workoutStore'
import { Dumbbell, Award, TrendingUp, LogOut, Save, Camera, Loader2, Check, AlertCircle, Star } from 'lucide-react'
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
    const [uploadMsg, setUploadMsg] = useState<string | null>(null)

    const totalVolume = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.reduce((c, s) => c + s.reps * s.weight_kg, 0), 0), 0)
    const inputClass = "w-full px-4 py-3 bg-surface-light/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setUploading(true)
        try {
            const ext = file.name.split('.').pop()
            const path = `avatars/${user.id}.${ext}`

            const { error: uploadErr } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true })

            if (uploadErr) throw uploadErr

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(path)

            const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

            await updateProfile({ avatar_url: avatarUrl })
            setUploadMsg('Photo updated!')
            setTimeout(() => setUploadMsg(null), 3000)
        } catch (err: any) {
            console.error('Upload failed:', err)
            setUploadMsg(err?.message || 'Upload failed. Make sure the "avatars" bucket exists in Supabase Storage.')
            setTimeout(() => setUploadMsg(null), 5000)
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

    const memberDays = user?.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000) : 0

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl"
            >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface to-secondary/15" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />

                <div className="relative px-6 py-8 text-center">
                    {/* Avatar */}
                    <div className="relative inline-block">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.display_name}
                                className="w-28 h-28 rounded-full object-cover shadow-2xl shadow-primary/20 border-3 border-primary/25 ring-4 ring-surface"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary via-primary-dark to-secondary mx-auto flex items-center justify-center text-white font-bold text-4xl shadow-2xl shadow-primary/25 ring-4 ring-surface">
                                {user?.display_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shadow-lg hover:brightness-110 transition disabled:opacity-50 ring-3 ring-surface"
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

                    <h1 className="text-2xl font-bold mt-5">{user?.display_name}</h1>
                    <p className="text-text-muted text-sm">@{user?.username}</p>

                    {uploadMsg && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs mt-2 flex items-center gap-1 justify-center ${uploadMsg.includes('failed') || uploadMsg.includes('Failed') ? 'text-danger' : 'text-success'}`}
                        >
                            {uploadMsg.includes('failed') || uploadMsg.includes('Failed') ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {uploadMsg}
                        </motion.p>
                    )}

                    {/* Member badge */}
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/60 text-xs text-text-muted backdrop-blur-sm">
                            <Star className="w-3 h-3 text-accent" />
                            Member for {memberDays > 0 ? `${memberDays} day${memberDays !== 1 ? 's' : ''}` : 'today'}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-3"
            >
                {[
                    { icon: Dumbbell, label: 'Workouts', value: workouts.length, gradient: 'from-primary/15 to-primary/5', color: 'text-primary-light', border: 'border-primary/10' },
                    { icon: Award, label: 'PRs', value: personalRecords.length, gradient: 'from-accent/15 to-accent/5', color: 'text-accent', border: 'border-accent/10' },
                    { icon: TrendingUp, label: 'Volume', value: `${(totalVolume / 1000).toFixed(1)}t`, gradient: 'from-secondary/15 to-secondary/5', color: 'text-secondary-light', border: 'border-secondary/10' },
                ].map((s) => (
                    <div key={s.label} className={`bg-gradient-to-br ${s.gradient} border ${s.border} rounded-2xl p-4 text-center`}>
                        <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                        <p className="text-xl font-bold stat-value">{s.value}</p>
                        <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
                    </div>
                ))}
            </motion.div>

            {/* Edit Profile */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="gradient-border"
            >
                <div className="bg-surface rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-bold">Edit Profile</h2>
                    <div>
                        <label className="text-xs text-text-muted mb-1.5 block font-medium">Display Name</label>
                        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1.5 block font-medium">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1.5 block font-medium">Email</label>
                        <input type="email" value={user?.email || ''} disabled className={`${inputClass} opacity-40 cursor-not-allowed`} />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium text-sm hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50"
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
            </motion.div>

            {/* Logout */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => { logout(); navigate('/login') }}
                className="w-full py-3 rounded-xl bg-danger/10 border border-danger/15 text-danger font-medium text-sm flex items-center justify-center gap-2 hover:bg-danger/20 hover:border-danger/25 transition-all"
            >
                <LogOut className="w-4 h-4" /> Sign Out
            </motion.button>
        </div>
    )
}
