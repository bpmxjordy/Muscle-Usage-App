import { useState } from 'react'
import { useWorkoutStore } from '../stores/workoutStore'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import type { Workout } from '../types'
import {
    Dumbbell,
    TrendingUp,
    Award,
    Clock,
    Flame,
    Plus,
    ChevronRight,
    Zap,
    X,
    Calendar,
    Target,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.15
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
}

function getStreak(workouts: Workout[]): number {
    if (workouts.length === 0) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dates = [...new Set(
        workouts.map(w => {
            const d = new Date(w.started_at)
            d.setHours(0, 0, 0, 0)
            return d.getTime()
        })
    )].sort((a, b) => b - a)

    let streak = 0
    const oneDay = 86400000
    const start = dates[0]
    if (start !== today.getTime() && start !== today.getTime() - oneDay) return 0

    for (let i = 0; i < dates.length; i++) {
        const expected = start - i * oneDay
        if (dates[i] === expected) {
            streak++
        } else {
            break
        }
    }
    return streak
}

export default function Dashboard() {
    const { user } = useAuthStore()
    const { workouts, personalRecords, activeWorkout, routines, startWorkout } = useWorkoutStore()
    const navigate = useNavigate()
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)

    const totalWorkouts = workouts.length
    const totalVolume = workouts.reduce(
        (acc, w) =>
            acc +
            w.exercises.reduce(
                (a, e) =>
                    a + e.sets.reduce((s, set) => s + set.reps * set.weight_kg, 0),
                0
            ),
        0
    )
    const totalPRs = personalRecords.length
    const lastWorkout = workouts[0]
    const streak = getStreak(workouts)

    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    }

    const stats = [
        { label: 'Workouts', value: totalWorkouts, icon: Dumbbell, gradient: 'from-primary/15 to-primary/5', iconColor: 'text-primary-light', border: 'border-primary/10' },
        { label: 'Volume', value: `${(totalVolume / 1000).toFixed(1)}t`, icon: TrendingUp, gradient: 'from-secondary/15 to-secondary/5', iconColor: 'text-secondary-light', border: 'border-secondary/10' },
        { label: 'PRs', value: totalPRs, icon: Award, gradient: 'from-accent/15 to-accent/5', iconColor: 'text-accent', border: 'border-accent/10' },
        { label: 'Last Session', value: lastWorkout ? `${lastWorkout.duration_minutes || 0}m` : '—', icon: Clock, gradient: 'from-success/15 to-success/5', iconColor: 'text-success', border: 'border-success/10' },
    ]

    return (
        <motion.div
            className="max-w-6xl mx-auto space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Greeting + Streak */}
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {greeting()},{' '}
                        <span className="shimmer-text">
                            {user?.display_name || 'Athlete'}
                        </span>
                    </h1>
                    <p className="text-text-muted mt-1 text-sm">Here's your training overview</p>
                </div>
                {streak > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 glow-accent"
                    >
                        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-accent animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-accent stat-value">{streak}</p>
                            <p className="text-[10px] text-text-muted leading-none">day streak</p>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item} className="flex flex-wrap gap-3">
                <button
                    onClick={() => {
                        if (!activeWorkout && user) {
                            startWorkout('Quick Workout', user.id)
                        }
                        navigate('/workout')
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-sm hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 transition-all shadow-lg shadow-primary/15"
                >
                    {activeWorkout ? (
                        <><Flame className="w-4 h-4 animate-pulse" /> Continue Workout</>
                    ) : (
                        <><Plus className="w-4 h-4" /> Start Workout</>
                    )}
                </button>
                <button
                    onClick={() => navigate('/ai-trainer')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/15 text-secondary-light font-medium text-sm hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/10 transition-all"
                >
                    <Target className="w-4 h-4" /> AI Trainer
                </button>
                <button
                    onClick={() => navigate('/routines')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-light border border-border text-text-muted font-medium text-sm hover:bg-surface-lighter hover:text-text hover:border-primary/20 transition-all"
                >
                    <Zap className="w-4 h-4" /> My Routines ({routines.length})
                </button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <motion.div key={stat.label} variants={item}
                        className={`bg-gradient-to-br ${stat.gradient} border ${stat.border} rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200`}
                    >
                        <div className={`w-10 h-10 rounded-xl bg-surface/60 flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                        </div>
                        <p className="text-2xl font-bold stat-value">{stat.value}</p>
                        <p className="text-sm text-text-muted mt-0.5">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Workouts */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Recent Workouts</h2>
                    <button onClick={() => navigate('/analytics')} className="text-sm text-primary-light hover:underline flex items-center gap-1 group">
                        View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
                {workouts.length === 0 ? (
                    <div className="gradient-border">
                        <div className="bg-surface rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Dumbbell className="w-8 h-8 text-primary-light opacity-60" />
                            </div>
                            <p className="text-text-muted font-medium">No workouts yet</p>
                            <p className="text-sm text-text-muted mt-1">Start your first workout to track your progress!</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {workouts.slice(0, 5).map((w, idx) => (
                            <motion.div
                                key={w.id}
                                variants={item}
                                onClick={() => setSelectedWorkout(w)}
                                className="bg-surface/60 border border-border/50 hover:border-primary/20 rounded-xl p-4 flex items-center justify-between cursor-pointer group transition-all hover:bg-surface/80"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                                        <span className="text-sm font-bold text-primary-light">{idx + 1}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white/90">{w.name}</p>
                                        <p className="text-sm text-text-muted">
                                            {w.exercises.length} exercises • {w.duration_minutes || 0} min • {new Date(w.started_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-text-muted/30 group-hover:text-primary-light group-hover:translate-x-0.5 transition-all" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Recent PRs */}
            {personalRecords.length > 0 && (
                <motion.div variants={item}>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-accent" /> Recent PRs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {personalRecords.slice(0, 4).map((pr) => (
                            <motion.div
                                key={pr.id}
                                variants={item}
                                className="bg-gradient-to-br from-accent/10 to-accent/3 border border-accent/10 rounded-xl p-4 flex items-center gap-4 hover:border-accent/20 transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                                    <Award className="w-5 h-5 text-accent" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-white/90 truncate">{pr.exercise_name}</p>
                                    <p className="text-sm text-text-muted">
                                        {pr.weight_kg}kg × {pr.reps} reps • Est. 1RM: {pr.estimated_1rm}kg
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Workout Detail Modal */}
            <AnimatePresence>
                {selectedWorkout && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
                        onClick={() => setSelectedWorkout(null)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold">{selectedWorkout.name}</h2>
                                    <p className="text-sm text-text-muted flex items-center gap-1.5 mt-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(selectedWorkout.started_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        {selectedWorkout.duration_minutes && <> • {selectedWorkout.duration_minutes} min</>}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedWorkout(null)} className="p-2 rounded-lg hover:bg-surface-light transition">
                                    <X className="w-5 h-5 text-text-muted" />
                                </button>
                            </div>

                            {/* Workout Summary Stats */}
                            <div className="grid grid-cols-3 gap-3 p-5 border-b border-border">
                                <div className="text-center p-3 rounded-xl bg-primary/5">
                                    <p className="text-xl font-bold text-primary-light stat-value">{selectedWorkout.exercises.length}</p>
                                    <p className="text-xs text-text-muted mt-0.5">Exercises</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-secondary/5">
                                    <p className="text-xl font-bold text-secondary-light stat-value">
                                        {selectedWorkout.exercises.reduce((a, e) => a + e.sets.length, 0)}
                                    </p>
                                    <p className="text-xs text-text-muted mt-0.5">Total Sets</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-accent/5">
                                    <p className="text-xl font-bold text-accent stat-value">
                                        {(selectedWorkout.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.reps * s.weight_kg, 0), 0) / 1000).toFixed(1)}t
                                    </p>
                                    <p className="text-xs text-text-muted mt-0.5">Volume</p>
                                </div>
                            </div>

                            {/* Exercises */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {selectedWorkout.exercises.map((we, idx) => (
                                    <div key={we.id} className="bg-surface-light/50 border border-border/50 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-light">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{we.exercise.name}</p>
                                                <p className="text-xs text-text-muted">{we.exercise.primary_muscles.join(', ')}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="grid grid-cols-4 text-[10px] text-text-muted font-medium uppercase tracking-wide px-2">
                                                <span>Set</span><span>Weight</span><span>Reps</span><span>Type</span>
                                            </div>
                                            {we.sets.map((s, sIdx) => (
                                                <div key={s.id} className={`grid grid-cols-4 text-sm px-2 py-1 rounded-lg ${s.is_pr ? 'bg-accent/10 text-accent' : ''}`}>
                                                    <span className="text-text-muted">{sIdx + 1}</span>
                                                    <span>{s.weight_kg}kg</span>
                                                    <span>{s.reps}</span>
                                                    <span className="text-xs">
                                                        {s.is_pr && <span className="text-accent font-semibold">PR 🏆</span>}
                                                        {s.is_warmup && <span className="text-amber-400 font-semibold">W</span>}
                                                        {!s.is_pr && !s.is_warmup && <span className="text-text-muted">—</span>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
