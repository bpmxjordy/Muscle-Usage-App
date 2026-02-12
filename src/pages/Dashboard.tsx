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
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
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
    // Allow today or yesterday to start the streak
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
        { label: 'Total Workouts', value: totalWorkouts, icon: Dumbbell, bg: 'bg-primary/10', color: 'text-primary-light' },
        { label: 'Total Volume', value: `${(totalVolume / 1000).toFixed(1)}t`, icon: TrendingUp, bg: 'bg-secondary/10', color: 'text-secondary-light' },
        { label: 'Personal Records', value: totalPRs, icon: Award, bg: 'bg-accent/10', color: 'text-accent' },
        { label: 'Last Workout', value: lastWorkout ? `${lastWorkout.duration_minutes || 0}m` : 'N/A', icon: Clock, bg: 'bg-success/10', color: 'text-success' },
    ]

    return (
        <motion.div
            className="max-w-6xl mx-auto space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {greeting()},{' '}
                        <span className="bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent">
                            {user?.display_name || 'Athlete'}
                        </span>
                    </h1>
                    <p className="text-text-muted mt-1">Here's your training overview</p>
                </div>
                {streak > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20">
                        <Flame className="w-5 h-5 text-accent animate-pulse" />
                        <div>
                            <p className="text-lg font-bold text-accent">{streak}</p>
                            <p className="text-[10px] text-text-muted leading-none">day streak</p>
                        </div>
                    </div>
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
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium text-sm hover:brightness-110 transition shadow-lg shadow-primary/20"
                >
                    {activeWorkout ? (
                        <><Flame className="w-4 h-4 animate-pulse" /> Continue Workout</>
                    ) : (
                        <><Plus className="w-4 h-4" /> Start Workout</>
                    )}
                </button>
                <button
                    onClick={() => navigate('/routines')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-light border border-border text-text-muted font-medium text-sm hover:bg-surface-lighter hover:text-text transition"
                >
                    <Zap className="w-4 h-4" /> My Routines ({routines.length})
                </button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <motion.div key={stat.label} variants={item}
                        className="glass glass-hover rounded-2xl p-5"
                    >
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-text-muted mt-0.5">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Workouts */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Recent Workouts</h2>
                    <button onClick={() => navigate('/analytics')} className="text-sm text-primary-light hover:underline flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                {workouts.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl p-10 text-center">
                        <Dumbbell className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
                        <p className="text-text-muted">No workouts yet.</p>
                        <p className="text-sm text-text-muted mt-1">Start your first workout to see it here!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {workouts.slice(0, 5).map((w) => (
                            <motion.div
                                key={w.id}
                                variants={item}
                                onClick={() => setSelectedWorkout(w)}
                                className="glass glass-hover rounded-xl p-4 flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Dumbbell className="w-5 h-5 text-primary-light" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white/90">{w.name}</p>
                                        <p className="text-sm text-text-muted">
                                            {w.exercises.length} exercises • {w.duration_minutes || 0} min • {new Date(w.started_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-text-muted/50 group-hover:text-primary-light transition" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Recent PRs */}
            {personalRecords.length > 0 && (
                <motion.div variants={item}>
                    <h2 className="text-xl font-bold mb-4">🏆 Recent PRs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {personalRecords.slice(0, 4).map((pr) => (
                            <motion.div
                                key={pr.id}
                                variants={item}
                                className="glass glass-hover rounded-xl p-4 flex items-center gap-4"
                            >
                                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <p className="font-medium text-white/90">{pr.exercise_name}</p>
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
                            className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
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
                                <div className="text-center">
                                    <p className="text-xl font-bold text-primary-light">{selectedWorkout.exercises.length}</p>
                                    <p className="text-xs text-text-muted">Exercises</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-secondary-light">
                                        {selectedWorkout.exercises.reduce((a, e) => a + e.sets.length, 0)}
                                    </p>
                                    <p className="text-xs text-text-muted">Total Sets</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-accent">
                                        {(selectedWorkout.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.reps * s.weight_kg, 0), 0) / 1000).toFixed(1)}t
                                    </p>
                                    <p className="text-xs text-text-muted">Volume</p>
                                </div>
                            </div>

                            {/* Exercises */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {selectedWorkout.exercises.map((we, idx) => (
                                    <div key={we.id} className="bg-surface-light border border-border rounded-xl p-4">
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
