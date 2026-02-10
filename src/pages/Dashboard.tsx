import { useWorkoutStore } from '../stores/workoutStore'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import {
    Dumbbell,
    TrendingUp,
    Award,
    Clock,
    Flame,
    Plus,
    ChevronRight,
    Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2 // Wait for page transition
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function Dashboard() {
    const { user } = useAuthStore()
    const { workouts, personalRecords, activeWorkout, routines, startWorkout } = useWorkoutStore()
    const navigate = useNavigate()

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

    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    }

    const stats = [
        { label: 'Total Workouts', value: totalWorkouts, icon: Dumbbell, bg: 'bg-primary/10' },
        { label: 'Total Volume', value: `${(totalVolume / 1000).toFixed(1)}t`, icon: TrendingUp, bg: 'bg-secondary/10' },
        { label: 'Personal Records', value: totalPRs, icon: Award, bg: 'bg-accent/10' },
        { label: 'Last Workout', value: lastWorkout ? `${lastWorkout.duration_minutes || 0}m` : 'N/A', icon: Clock, bg: 'bg-success/10' },
    ]

    return (
        <motion.div
            className="max-w-6xl mx-auto space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">
                    {greeting()},{' '}
                    <span className="bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent">
                        {user?.display_name || 'Athlete'}
                    </span>
                </h1>
                <p className="text-text-muted mt-1">Here's your training overview</p>
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
                            <stat.icon className="w-5 h-5 text-primary-light" />
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
                                className="glass glass-hover rounded-xl p-4 flex items-center justify-between cursor-pointer"
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
                                <ChevronRight className="w-5 h-5 text-text-muted/50" />
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
        </motion.div>
    )
}
