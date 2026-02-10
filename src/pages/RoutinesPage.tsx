import { useState } from 'react'
import { useWorkoutStore } from '../stores/workoutStore'
import { useAuthStore } from '../stores/authStore'
import { exercises as exerciseDB } from '../data/exercises'
import { useNavigate } from 'react-router-dom'
import {
    Plus,
    Trash2,
    ClipboardList,
    Play,
    X,
    Search,
    Dumbbell,
    GripVertical,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RoutineExercise, Exercise } from '../types'

export default function RoutinesPage() {
    const { user } = useAuthStore()
    const { routines, createRoutine, deleteRoutine, startFromRoutine } = useWorkoutStore()
    const navigate = useNavigate()
    const [showCreator, setShowCreator] = useState(false)
    const [routineName, setRoutineName] = useState('')
    const [routineDesc, setRoutineDesc] = useState('')
    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([])
    const [showExercisePicker, setShowExercisePicker] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const addExerciseToRoutine = (exercise: Exercise) => {
        const newRE: RoutineExercise = {
            exercise,
            target_sets: 3,
            target_reps_min: 8,
            target_reps_max: 12,
            rest_seconds: 90,
            order: routineExercises.length + 1,
        }
        setRoutineExercises([...routineExercises, newRE])
        setShowExercisePicker(false)
    }

    const removeExerciseFromRoutine = (idx: number) => {
        setRoutineExercises(routineExercises.filter((_, i) => i !== idx))
    }

    const updateRoutineExercise = (
        idx: number,
        field: keyof RoutineExercise,
        value: any
    ) => {
        const updated = [...routineExercises]
        updated[idx] = { ...updated[idx], [field]: value }
        setRoutineExercises(updated)
    }

    const handleSaveRoutine = async () => {
        if (!routineName || routineExercises.length === 0 || !user) return
        setIsSaving(true)
        try {
            await createRoutine(user.id, {
                name: routineName,
                description: routineDesc,
                exercises: routineExercises,
                is_public: false,
            })
            setRoutineName('')
            setRoutineDesc('')
            setRoutineExercises([])
            setShowCreator(false)
        } finally {
            setIsSaving(false)
        }
    }

    const handleStartRoutine = (routine: typeof routines[0]) => {
        if (!user) return
        startFromRoutine(routine, user.id)
        navigate('/workout')
    }

    const handleDeleteRoutine = async (id: string) => {
        await deleteRoutine(id)
    }

    const filteredExercises = exerciseDB.filter(
        (e) =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.primary_muscles.some((m) =>
                m.toLowerCase().includes(searchTerm.toLowerCase())
            )
    )

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Routines</h1>
                    <p className="text-text-muted">Create and manage your training plans</p>
                </div>
                <button
                    onClick={() => setShowCreator(!showCreator)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium text-sm hover:brightness-110 transition shadow-lg shadow-primary/25"
                >
                    <Plus className="w-4 h-4" />
                    New Routine
                </button>
            </div>

            {/* Routine Creator */}
            <AnimatePresence>
                {showCreator && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-surface border border-border rounded-2xl overflow-hidden"
                    >
                        <div className="p-6 space-y-4">
                            <h2 className="text-lg font-bold">Create New Routine</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-text-muted mb-1 block">
                                        Routine Name
                                    </label>
                                    <input
                                        type="text"
                                        value={routineName}
                                        onChange={(e) => setRoutineName(e.target.value)}
                                        placeholder="e.g., Push Day, PPL Day A..."
                                        className="w-full px-4 py-2.5 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-text-muted mb-1 block">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={routineDesc}
                                        onChange={(e) => setRoutineDesc(e.target.value)}
                                        placeholder="Optional description..."
                                        className="w-full px-4 py-2.5 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                                    />
                                </div>
                            </div>

                            {/* Exercises in routine */}
                            <div className="space-y-2">
                                {routineExercises.map((re, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-3 bg-surface-light rounded-xl"
                                    >
                                        <GripVertical className="w-4 h-4 text-text-muted flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {re.exercise.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={re.target_sets}
                                                onChange={(e) =>
                                                    updateRoutineExercise(idx, 'target_sets', parseInt(e.target.value) || 0)
                                                }
                                                className="w-14 px-2 py-1 bg-surface border border-border rounded-lg text-xs text-center"
                                                title="Sets"
                                            />
                                            <span className="text-xs text-text-muted">×</span>
                                            <input
                                                type="number"
                                                value={re.target_reps_min}
                                                onChange={(e) =>
                                                    updateRoutineExercise(idx, 'target_reps_min', parseInt(e.target.value) || 0)
                                                }
                                                className="w-14 px-2 py-1 bg-surface border border-border rounded-lg text-xs text-center"
                                                title="Min reps"
                                            />
                                            <span className="text-xs text-text-muted">-</span>
                                            <input
                                                type="number"
                                                value={re.target_reps_max}
                                                onChange={(e) =>
                                                    updateRoutineExercise(idx, 'target_reps_max', parseInt(e.target.value) || 0)
                                                }
                                                className="w-14 px-2 py-1 bg-surface border border-border rounded-lg text-xs text-center"
                                                title="Max reps"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeExerciseFromRoutine(idx)}
                                            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowExercisePicker(true)}
                                className="w-full py-3 rounded-xl border-2 border-dashed border-border text-text-muted hover:border-primary/50 hover:text-primary-light transition flex items-center justify-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Exercise
                            </button>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCreator(false)}
                                    className="px-5 py-2 rounded-xl bg-surface-light border border-border text-text-muted text-sm hover:text-text transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveRoutine}
                                    disabled={isSaving}
                                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium text-sm hover:brightness-110 transition disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Routine'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Routine List */}
            {routines.length === 0 && !showCreator ? (
                <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                    <ClipboardList className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
                    <p className="text-text-muted">No routines yet.</p>
                    <p className="text-sm text-text-muted mt-1">
                        Create your first routine to get started!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {routines.map((routine) => (
                        <motion.div
                            key={routine.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-lg">{routine.name}</h3>
                                    {routine.description && (
                                        <p className="text-sm text-text-muted mt-0.5">
                                            {routine.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteRoutine(routine.id)}
                                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                {routine.exercises.slice(0, 4).map((re, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-text-muted">
                                        <Dumbbell className="w-3.5 h-3.5" />
                                        <span className="truncate">{re.exercise.name}</span>
                                        <span className="ml-auto text-xs">
                                            {re.target_sets}×{re.target_reps_min}-{re.target_reps_max}
                                        </span>
                                    </div>
                                ))}
                                {routine.exercises.length > 4 && (
                                    <p className="text-xs text-text-muted pl-5">
                                        +{routine.exercises.length - 4} more
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => handleStartRoutine(routine)}
                                className="w-full py-2.5 rounded-xl bg-primary/10 text-primary-light font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/20 transition"
                            >
                                <Play className="w-4 h-4" /> Start Routine
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

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
                                        placeholder="Search exercises..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-96 p-2">
                                {filteredExercises.map((ex) => (
                                    <button
                                        key={ex.id}
                                        onClick={() => addExerciseToRoutine(ex)}
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
        </div>
    )
}
