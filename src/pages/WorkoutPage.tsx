import { useState, useEffect, useRef, useCallback } from 'react'
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
    Play,
    Pause,
    SkipForward,
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

    // Rest timer
    const [restTime, setRestTime] = useState(90) // default 90s
    const [restRemaining, setRestRemaining] = useState(0)
    const [isResting, setIsResting] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const startRestTimer = useCallback((duration?: number) => {
        const d = duration || restTime
        setRestRemaining(d)
        setIsResting(true)
        setIsPaused(false)
    }, [restTime])

    const stopRestTimer = useCallback(() => {
        setIsResting(false)
        setRestRemaining(0)
        setIsPaused(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
    }, [])

    useEffect(() => {
        if (isResting && !isPaused && restRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setRestRemaining(prev => {
                    if (prev <= 1) {
                        setIsResting(false)
                        // Play a notification beep
                        try {
                            const ctx = new AudioContext()
                            const osc = ctx.createOscillator()
                            const gain = ctx.createGain()
                            osc.connect(gain)
                            gain.connect(ctx.destination)
                            osc.frequency.value = 880
                            gain.gain.value = 0.3
                            osc.start()
                            osc.stop(ctx.currentTime + 0.15)
                            setTimeout(() => {
                                const osc2 = ctx.createOscillator()
                                const gain2 = ctx.createGain()
                                osc2.connect(gain2)
                                gain2.connect(ctx.destination)
                                osc2.frequency.value = 1100
                                gain2.gain.value = 0.3
                                osc2.start()
                                osc2.stop(ctx.currentTime + 0.2)
                            }, 200)
                        } catch { /* audio not available */ }
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [isResting, isPaused, restRemaining])

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
                    transition={{ type: 'spring', damping: 15 }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-secondary mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-primary/30 glow-primary"
                >
                    <Dumbbell className="w-12 h-12 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">Start a New Workout</h1>
                <p className="text-text-muted mb-8 text-sm">Give your workout a name and let's crush it</p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                    <input
                        type="text"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="e.g., Push Day, Leg Day..."
                        className="flex-1 px-5 py-3.5 bg-surface/60 border border-border/50 rounded-xl text-text placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"
                    />
                    <button
                        onClick={() => user && startWorkout(workoutName || 'Workout', user.id)}
                        className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold hover:brightness-110 hover:shadow-lg hover:shadow-primary/30 transition-all shadow-lg shadow-primary/20"
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
                    <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 text-sm text-text-muted">
                            <Timer className="w-4 h-4 text-primary-light" /> {elapsed} min
                        </span>
                        <span className="text-border">•</span>
                        <span className="text-sm text-text-muted">{activeWorkout.exercises.length} exercises</span>
                        <span className="text-border">•</span>
                        <span className="text-sm text-text-muted">{activeWorkout.exercises.reduce((a, e) => a + e.sets.length, 0)} sets</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={cancelWorkout}
                        className="p-2.5 rounded-xl bg-surface-light border border-border text-text-muted text-sm hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleFinish}
                        disabled={isFinishing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-success to-emerald-600 text-white font-medium text-sm flex items-center gap-2 hover:brightness-110 hover:shadow-lg hover:shadow-success/25 transition-all shadow-lg shadow-success/15 disabled:opacity-50"
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
                        className="bg-surface/60 border border-border/50 rounded-2xl overflow-hidden hover:border-primary/15 transition-colors"
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
                                    <div className="px-4 py-3 bg-surface-light/30 border-t border-border/50 flex items-center gap-3">
                                        <button
                                            onClick={() => { addSet(exIdx); startRestTimer() }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium hover:brightness-110 hover:shadow-md hover:shadow-primary/20 transition-all"
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

            {/* Rest Timer */}
            <AnimatePresence>
                {isResting && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface/95 backdrop-blur-xl border border-primary/20 rounded-2xl px-6 py-4 shadow-2xl shadow-primary/15 glow-primary flex items-center gap-5"
                    >
                        {/* Circular progress */}
                        <div className="relative w-14 h-14">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-surface-light" strokeWidth="3" />
                                <circle
                                    cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="text-primary-light"
                                    strokeDasharray={`${(restRemaining / restTime) * 94.2} 94.2`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold font-mono">{restRemaining}s</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Rest Timer</p>
                            <div className="flex gap-1 mt-1">
                                {[30, 60, 90, 120].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { setRestTime(t); startRestTimer(t) }}
                                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${restTime === t ? 'bg-primary/20 text-primary-light' : 'bg-surface-light text-text-muted hover:text-text'}`}
                                    >
                                        {t}s
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="p-2 rounded-lg bg-surface-light hover:bg-surface-lighter transition"
                            >
                                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={stopRestTimer}
                                className="p-2 rounded-lg bg-surface-light hover:bg-surface-lighter transition text-text-muted hover:text-text"
                            >
                                <SkipForward className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Exercise Button */}
            <button
                onClick={() => setShowExercisePicker(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-border/50 text-text-muted hover:border-primary/40 hover:text-primary-light hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium group"
            >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Add Exercise
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
                            className="bg-surface border border-border/50 rounded-2xl w-full max-w-lg max-h-[70vh] overflow-hidden shadow-2xl"
                        >
                            <div className="p-5 border-b border-border/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-bold text-lg">Add Exercise</h2>
                                    <button onClick={() => setShowExercisePicker(false)} className="p-1.5 rounded-lg hover:bg-surface-light transition">
                                        <X className="w-5 h-5 text-text-muted" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/60" />
                                    <input
                                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search exercises or muscle groups..."
                                        className="w-full pl-11 pr-4 py-3 bg-surface-light/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-96 p-2">
                                {filteredExercises.map((ex) => (
                                    <button
                                        key={ex.id}
                                        onClick={() => { addExercise(ex.id); setShowExercisePicker(false); setSearchTerm('') }}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/5 transition-all text-left group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:from-primary/25 group-hover:to-primary/10 transition-all">
                                            <Dumbbell className="w-4 h-4 text-primary-light" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{ex.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {ex.primary_muscles.slice(0, 2).map(m => (
                                                    <span key={m} className="px-1.5 py-0.5 rounded bg-surface-light text-[10px] text-text-muted">{m}</span>
                                                ))}
                                                <span className="text-[10px] text-text-muted/60">• {ex.equipment}</span>
                                            </div>
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
