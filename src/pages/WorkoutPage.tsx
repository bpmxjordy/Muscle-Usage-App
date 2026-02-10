import { useState } from 'react'
import { useWorkoutStore } from '../stores/workoutStore'
import { useAuthStore } from '../stores/authStore'
import { exercises as exerciseDB } from '../data/exercises'
import {
    Dumbbell,
    Plus,
    Trash2,
    CheckCircle,
    X,
    Search,
    Timer,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WorkoutPage() {
    const { user } = useAuthStore()
    const {
        activeWorkout,
        startWorkout,
        addExercise,
        removeExercise,
        addSet,
        updateSet,
        removeSet,
        completeWorkout,
        cancelWorkout,
    } = useWorkoutStore()

    const [workoutName, setWorkoutName] = useState('')
    const [showExercisePicker, setShowExercisePicker] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedExercise, setExpandedExercise] = useState<number | null>(null)
    const [isFinishing, setIsFinishing] = useState(false)

    const filteredExercises = exerciseDB.filter(
        (e) =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.primary_muscles.some((m) =>
                m.toLowerCase().includes(searchTerm.toLowerCase())
            )
    )

    const handleFinish = async () => {
        if (!user) return
        setIsFinishing(true)
        try {
            await completeWorkout(user.id)
        } finally {
            setIsFinishing(false)
        }
    }

    // ─── No Active Workout ─────────────────────────────────────────
    if (!activeWorkout) {
        return (
            <motion.div
                className="max-w-xl mx-auto text-center py-20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary mx-auto mb-6 flex items-center justify-center shadow-xl shadow-primary/20"
                >
                    <Dumbbell className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">Start a New Workout</h1>
                <p className="text-text-muted mb-8">Give your workout a name and let's go!</p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <input
                        type="text"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="e.g., Push Day, Leg Day..."
                        className="px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                    <button
                        onClick={() => user && startWorkout(workoutName || 'Workout', user.id)}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold hover:brightness-110 transition shadow-lg shadow-primary/25"
                    >
                        Let's Go! 💪
                    </button>
                </div>
            </motion.div>
        )
    }

    // ─── Active Workout ────────────────────────────────────────────
    const elapsed = Math.round(
        (Date.now() - new Date(activeWorkout.started_at).getTime()) / 60000
    )

    return (
        <motion.div
            className="max-w-3xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{activeWorkout.name}</h1>
                    <p className="text-text-muted flex items-center gap-2">
                        <Timer className="w-4 h-4" /> {elapsed} min elapsed
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={cancelWorkout}
                        className="px-4 py-2 rounded-xl bg-surface-light border border-border text-text-muted text-sm hover:text-danger hover:border-danger/50 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleFinish}
                        disabled={isFinishing}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-success to-success text-white font-medium text-sm flex items-center gap-2 hover:brightness-110 transition shadow-lg shadow-success/20 disabled:opacity-50"
                    >
                        {isFinishing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )} Finish
                    </button>
                </div>
            </div>

            {/* Exercises */}
            <div className="space-y-4">
                {activeWorkout.exercises.map((we, exIdx) => (
                    <motion.div
                        key={we.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface border border-border rounded-2xl overflow-hidden"
                    >
                        {/* Exercise Header */}
                        <div className="flex items-center justify-between p-4">
                            <button
                                onClick={() => setExpandedExercise(expandedExercise === exIdx ? null : exIdx)}
                                className="flex items-center gap-3 text-left flex-1"
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Dumbbell className="w-4 h-4 text-primary-light" />
                                </div>
                                <div>
                                    <p className="font-medium">{we.exercise.name}</p>
                                    <p className="text-xs text-text-muted">
                                        {we.sets.length} sets • {we.exercise.primary_muscles.join(', ')}
                                    </p>
                                </div>
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={() => removeExercise(exIdx)} className="p-1 text-text-muted hover:text-danger transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {expandedExercise === exIdx ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                            </div>
                        </div>

                        {/* Sets Table */}
                        <AnimatePresence>
                            {(expandedExercise === exIdx || we.sets.length === 0) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-border"
                                >
                                    {we.sets.length > 0 && (
                                        <div className="px-4 py-2">
                                            <div className="grid grid-cols-[2rem_3.5rem_1fr_1fr_1fr_2rem] gap-2 text-xs text-text-muted font-medium mb-1 px-1">
                                                <span>#</span>
                                                <span>Type</span>
                                                <span>Weight (kg)</span>
                                                <span>Reps</span>
                                                <span>RPE</span>
                                                <span />
                                            </div>
                                            {we.sets.map((s, sIdx) => (
                                                <div
                                                    key={s.id}
                                                    className={`grid grid-cols-[2rem_3.5rem_1fr_1fr_1fr_2rem] gap-2 items-center py-1.5 px-1 rounded-lg text-sm ${s.is_warmup ? 'opacity-60' : ''} ${s.is_pr ? 'bg-accent/10 text-accent' : ''}`}
                                                >
                                                    <span className="text-text-muted text-xs">{sIdx + 1}</span>
                                                    <button
                                                        onClick={() => updateSet(exIdx, sIdx, { is_warmup: !s.is_warmup })}
                                                        className={`px-1.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition ${s.is_warmup
                                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                            : 'bg-surface-light text-text-muted border border-border hover:border-amber-500/30 hover:text-amber-400'
                                                            }`}
                                                        title={s.is_warmup ? 'Warm-up set (click to toggle)' : 'Working set (click to toggle)'}
                                                    >
                                                        {s.is_warmup ? 'W' : 'WK'}
                                                    </button>
                                                    <input type="number" value={s.weight_kg || ''} onChange={(e) => updateSet(exIdx, sIdx, { weight_kg: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1.5 bg-surface-light border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition" placeholder="kg" />
                                                    <input type="number" value={s.reps || ''} onChange={(e) => updateSet(exIdx, sIdx, { reps: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 bg-surface-light border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition" placeholder="reps" />
                                                    <input type="number" min="1" max="10" value={s.rpe || ''} onChange={(e) => updateSet(exIdx, sIdx, { rpe: parseInt(e.target.value) || undefined })} className="w-full px-2 py-1.5 bg-surface-light border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition" placeholder="1-10" />
                                                    <button onClick={() => removeSet(exIdx, sIdx)} className="text-text-muted hover:text-danger transition">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Set Button */}
                                    <div className="px-4 py-3 bg-surface-light/50 border-t border-border flex items-center gap-3">
                                        <button
                                            onClick={() => addSet(exIdx)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:brightness-110 transition"
                                        >
                                            <Plus className="w-4 h-4" /> Add Set
                                        </button>
                                        <div className="ml-auto flex items-center gap-2 text-[10px] text-text-muted">
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">W</span> = Warm-up
                                            <span className="px-1.5 py-0.5 rounded bg-surface-light font-semibold">WK</span> = Working
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Add Exercise Button */}
            <button
                onClick={() => setShowExercisePicker(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-text-muted hover:border-primary/50 hover:text-primary-light transition flex items-center justify-center gap-2 text-sm font-medium"
            >
                <Plus className="w-5 h-5" /> Add Exercise
            </button>

            {/* Exercise Picker Modal */}
            <AnimatePresence>
                {showExercisePicker && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
                        onClick={() => setShowExercisePicker(false)}
                    >
                        <motion.div
                            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[70vh] overflow-hidden"
                        >
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-bold text-lg">Add Exercise</h2>
                                    <button onClick={() => setShowExercisePicker(false)} className="p-1 rounded-lg hover:bg-surface-light transition">
                                        <X className="w-5 h-5 text-text-muted" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search exercises or muscle groups..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-96 p-2">
                                {filteredExercises.map((ex) => (
                                    <button
                                        key={ex.id}
                                        onClick={() => { addExercise(ex.id); setShowExercisePicker(false); setSearchTerm('') }}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-light transition text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Dumbbell className="w-4 h-4 text-primary-light" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{ex.name}</p>
                                            <p className="text-xs text-text-muted">{ex.primary_muscles.join(', ')} • {ex.equipment}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
