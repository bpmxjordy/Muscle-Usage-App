import { useState } from 'react'
import { getExerciseById } from '../data/exercises'
import { useWorkoutStore } from '../stores/workoutStore'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import {
    generateRoutine,
    goalLabels,
    goalDescriptions,
    levelLabels,
    type GoalType,
    type LevelType,
    type EquipmentType,
    type RoutineTemplate,
    type RoutineDay,
} from '../data/routineTemplates'
import {
    Sparkles,
    Dumbbell,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Target,
    Zap,
    Wrench,
    CalendarDays,
    Save,
    Check,
    ChevronLeft,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const equipmentLabels: Record<EquipmentType, string> = {
    full_gym: '🏢 Full Gym',
    home_gym: '🏠 Home Gym',
    bodyweight: '🤸 Bodyweight Only',
}

const daysOptions = [3, 4, 5, 6]
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

type Step = 'goal' | 'level' | 'equipment' | 'days' | 'result' | 'schedule'

export default function AITrainerPage() {
    const { user } = useAuthStore()
    const { createRoutine } = useWorkoutStore()
    const navigate = useNavigate()

    const [step, setStep] = useState<Step>('goal')
    const [goal, setGoal] = useState<GoalType | null>(null)
    const [level, setLevel] = useState<LevelType | null>(null)
    const [equipment, setEquipment] = useState<EquipmentType | null>(null)
    const [routine, setRoutine] = useState<RoutineTemplate | null>(null)
    const [expandedDay, setExpandedDay] = useState<number | null>(0)

    // Schedule step state
    const [dayAssignments, setDayAssignments] = useState<Record<number, string>>({})
    const [activeSlide, setActiveSlide] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    const handleGenerate = (selectedDays: number) => {
        if (!goal || !level || !equipment) return
        const result = generateRoutine(goal, level, selectedDays, equipment)
        setRoutine(result)
        setStep('result')
    }

    const handleReset = () => {
        setStep('goal')
        setGoal(null)
        setLevel(null)
        setEquipment(null)
        setRoutine(null)
        setExpandedDay(0)
        setDayAssignments({})
        setActiveSlide(0)
        setSaveSuccess(false)
    }

    const handleStartSchedule = () => {
        if (!routine) return
        // Auto-suggest day assignments based on routine day count
        const suggested: Record<number, string> = {}
        const spreadDays = getSuggestedDays(routine.daysPerWeek)
        routine.days.forEach((_, idx) => {
            suggested[idx] = WEEKDAYS[spreadDays[idx]]
        })
        setDayAssignments(suggested)
        setActiveSlide(0)
        setStep('schedule')
    }

    const handleSaveRoutines = async () => {
        if (!routine || !user) return
        setIsSaving(true)
        try {
            for (let i = 0; i < routine.days.length; i++) {
                const day = routine.days[i]
                const assignedDay = dayAssignments[i] || WEEKDAYS[i]
                const exercises = day.exercises.map((te, order) => {
                    const exercise = getExerciseById(te.exerciseId)
                    return {
                        exercise: exercise || {
                            id: te.exerciseId,
                            name: te.exerciseId,
                            category: 'compound' as const,
                            equipment: '',
                            primary_muscles: [],
                            secondary_muscles: [],
                            instructions: '',
                        },
                        target_sets: te.sets,
                        target_reps_min: te.repsMin,
                        target_reps_max: te.repsMax,
                        rest_seconds: te.restSeconds,
                        order,
                    }
                })

                await createRoutine(user.id, {
                    name: `${routine.name} — ${day.name}`,
                    description: `${day.focus} • ${routine.description}`,
                    day_of_week: assignedDay,
                    exercises,
                    is_public: false,
                })
            }
            setSaveSuccess(true)
        } catch (err) {
            console.error('Failed to save routines:', err)
        } finally {
            setIsSaving(false)
        }
    }

    const stepVariants = {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 },
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">AI Personal Trainer</h1>
                        <p className="text-text-muted text-sm">Get a personalized routine in seconds</p>
                    </div>
                </div>
            </motion.div>

            {/* Progress Indicator */}
            {!['result', 'schedule'].includes(step) && (
                <div className="flex items-center gap-2">
                    {['goal', 'level', 'equipment', 'days'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${['goal', 'level', 'equipment', 'days'].indexOf(step) >= i
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                    : 'bg-surface-light'
                                }`}
                            />
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* Step 1: Goal */}
                {step === 'goal' && (
                    <motion.div key="goal" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <Target className="w-5 h-5 text-purple-400" />
                            What's your training goal?
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(Object.keys(goalLabels) as GoalType[]).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => { setGoal(g); setStep('level') }}
                                    className="text-left p-4 rounded-xl bg-surface border border-border hover:border-purple-500/50 hover:bg-surface-light transition-all group"
                                >
                                    <p className="font-semibold text-sm group-hover:text-purple-300 transition">{goalLabels[g]}</p>
                                    <p className="text-xs text-text-muted mt-1">{goalDescriptions[g]}</p>
                                    <ChevronRight className="w-4 h-4 text-text-muted mt-2 group-hover:text-purple-400 transition" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Level */}
                {step === 'level' && (
                    <motion.div key="level" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <Zap className="w-5 h-5 text-purple-400" />
                            Your experience level?
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(Object.keys(levelLabels) as LevelType[]).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => { setLevel(l); setStep('equipment') }}
                                    className="p-4 rounded-xl bg-surface border border-border hover:border-purple-500/50 hover:bg-surface-light transition-all text-center group"
                                >
                                    <p className="font-semibold group-hover:text-purple-300 transition">{levelLabels[l]}</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep('goal')} className="text-xs text-text-muted hover:text-text transition">← Back</button>
                    </motion.div>
                )}

                {/* Step 3: Equipment */}
                {step === 'equipment' && (
                    <motion.div key="equipment" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <Wrench className="w-5 h-5 text-purple-400" />
                            Available equipment?
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(Object.keys(equipmentLabels) as EquipmentType[]).map((e) => (
                                <button
                                    key={e}
                                    onClick={() => { setEquipment(e); setStep('days') }}
                                    className="p-4 rounded-xl bg-surface border border-border hover:border-purple-500/50 hover:bg-surface-light transition-all text-center group"
                                >
                                    <p className="font-semibold group-hover:text-purple-300 transition">{equipmentLabels[e]}</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep('level')} className="text-xs text-text-muted hover:text-text transition">← Back</button>
                    </motion.div>
                )}

                {/* Step 4: Days */}
                {step === 'days' && (
                    <motion.div key="days" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <CalendarDays className="w-5 h-5 text-purple-400" />
                            How many days per week?
                        </div>
                        <div className="flex gap-3">
                            {daysOptions.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => { handleGenerate(d) }}
                                    className="flex-1 py-4 rounded-xl bg-surface border border-border hover:border-purple-500/50 hover:bg-surface-light transition-all text-center group"
                                >
                                    <p className="text-2xl font-bold group-hover:text-purple-300 transition">{d}</p>
                                    <p className="text-xs text-text-muted">days</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep('equipment')} className="text-xs text-text-muted hover:text-text transition">← Back</button>
                    </motion.div>
                )}

                {/* Result */}
                {step === 'result' && routine && (
                    <motion.div key="result" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                        {/* Routine Header */}
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide mb-1">Your Generated Routine</p>
                                    <h2 className="text-xl font-bold">{routine.name}</h2>
                                    <p className="text-sm text-text-muted mt-1">{routine.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="px-2 py-1 rounded-lg bg-surface-light text-xs font-medium">{goalLabels[routine.goal]}</span>
                                        <span className="px-2 py-1 rounded-lg bg-surface-light text-xs font-medium">{levelLabels[routine.level]}</span>
                                        <span className="px-2 py-1 rounded-lg bg-surface-light text-xs font-medium">{routine.daysPerWeek} days/week</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="p-2 rounded-lg hover:bg-surface-light transition text-text-muted hover:text-purple-400"
                                    title="Generate new routine"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Days */}
                        <div className="space-y-3">
                            {routine.days.map((day, dayIdx) => (
                                <DayCard
                                    key={dayIdx}
                                    day={day}
                                    dayIdx={dayIdx}
                                    isExpanded={expandedDay === dayIdx}
                                    onToggle={() => setExpandedDay(expandedDay === dayIdx ? null : dayIdx)}
                                />
                            ))}
                        </div>

                        {/* Save Button */}
                        <motion.button
                            onClick={handleStartSchedule}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition shadow-xl shadow-purple-500/25"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <Save className="w-5 h-5" />
                            Save to My Routines & Schedule
                        </motion.button>
                    </motion.div>
                )}

                {/* Schedule Step — Day Slider */}
                {step === 'schedule' && routine && (
                    <motion.div key="schedule" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">

                        {saveSuccess ? (
                            /* ─── Success State ─── */
                            <div className="text-center py-12">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 15 }}
                                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto mb-6 flex items-center justify-center shadow-xl shadow-green-500/30"
                                >
                                    <Check className="w-10 h-10 text-white" />
                                </motion.div>
                                <h2 className="text-2xl font-bold mb-2">Routines Saved! 🎉</h2>
                                <p className="text-text-muted mb-8">
                                    {routine.days.length} routines have been saved to your weekly schedule.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => navigate('/routines')}
                                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:brightness-110 transition"
                                    >
                                        View My Routines
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-3 rounded-xl bg-surface-light border border-border text-sm hover:bg-surface transition"
                                    >
                                        Generate Another
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ─── Day Scheduler ─── */
                            <>
                                <div>
                                    <h2 className="text-lg font-bold mb-1">Schedule Your Week</h2>
                                    <p className="text-text-muted text-sm">Assign each training day to a day of the week. We've suggested an optimal spread.</p>
                                </div>

                                {/* Day Slider Tabs */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {routine.days.map((day, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveSlide(idx)}
                                            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSlide === idx
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                                                    : 'bg-surface border border-border text-text-muted hover:border-purple-500/30'
                                                }`}
                                        >
                                            <span className="block text-xs opacity-70">Day {idx + 1}</span>
                                            <span className="block">{day.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Active Day Card */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeSlide}
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        {/* Day Assignment */}
                                        <div className="bg-surface border border-border rounded-2xl p-5">
                                            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">
                                                Assign "{routine.days[activeSlide].name}" to:
                                            </p>
                                            <div className="grid grid-cols-7 gap-1.5">
                                                {WEEKDAYS.map((wd, wdIdx) => {
                                                    const isAssigned = dayAssignments[activeSlide] === wd
                                                    const assignedByOther = Object.entries(dayAssignments).some(
                                                        ([k, v]) => v === wd && parseInt(k) !== activeSlide
                                                    )
                                                    return (
                                                        <button
                                                            key={wd}
                                                            onClick={() => setDayAssignments({ ...dayAssignments, [activeSlide]: wd })}
                                                            className={`py-3 rounded-xl text-xs font-medium transition-all ${isAssigned
                                                                    ? 'bg-gradient-to-b from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30 scale-105'
                                                                    : assignedByOther
                                                                        ? 'bg-surface-light text-text-muted/40 border border-border cursor-not-allowed'
                                                                        : 'bg-surface-light border border-border text-text-muted hover:border-purple-500/50 hover:text-purple-300'
                                                                }`}
                                                            disabled={assignedByOther}
                                                        >
                                                            {WEEKDAY_SHORT[wdIdx]}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Exercise Preview */}
                                        <DayCard
                                            day={routine.days[activeSlide]}
                                            dayIdx={activeSlide}
                                            isExpanded={true}
                                            onToggle={() => { }}
                                            badge={dayAssignments[activeSlide]}
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Navigation + Save */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setStep('result')}
                                        className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-surface-light border border-border text-sm text-text-muted hover:text-text transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>

                                    <div className="flex-1 flex justify-center gap-1">
                                        {routine.days.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveSlide(idx)}
                                                className={`w-2 h-2 rounded-full transition-all ${activeSlide === idx ? 'bg-purple-400 w-6' : 'bg-surface-light'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    {activeSlide < routine.days.length - 1 ? (
                                        <button
                                            onClick={() => setActiveSlide(activeSlide + 1)}
                                            className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300 hover:bg-purple-500/30 transition"
                                        >
                                            Next <ChevronRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSaveRoutines}
                                            disabled={isSaving || Object.keys(dayAssignments).length < routine.days.length}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:brightness-110 transition shadow-lg shadow-purple-500/25 disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Save All
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Helper: Suggest day spread ────────────────────────────────────────────
function getSuggestedDays(count: number): number[] {
    const spreads: Record<number, number[]> = {
        3: [0, 2, 4],             // Mon, Wed, Fri
        4: [0, 1, 3, 4],          // Mon, Tue, Thu, Fri
        5: [0, 1, 2, 3, 4],       // Mon–Fri
        6: [0, 1, 2, 3, 4, 5],    // Mon–Sat
    }
    return spreads[count] || spreads[3]
}

// ─── Reusable Day Card Component ──────────────────────────────────────────
function DayCard({ day, dayIdx, isExpanded, onToggle, badge }: {
    day: RoutineDay
    dayIdx: number
    isExpanded: boolean
    onToggle: () => void
    badge?: string
}) {
    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-light transition"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-sm font-bold text-purple-300">
                        {dayIdx + 1}
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-sm">{day.name}</p>
                        <p className="text-xs text-text-muted">{day.focus}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {badge && (
                        <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-medium">
                            {badge}
                        </span>
                    )}
                    {isExpanded
                        ? <ChevronUp className="w-5 h-5 text-text-muted" />
                        : <ChevronDown className="w-5 h-5 text-text-muted" />
                    }
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border"
                    >
                        <div className="p-4 space-y-2">
                            {/* Table Header */}
                            <div className="grid grid-cols-[1fr_3rem_4rem_3rem] gap-2 text-[10px] text-text-muted font-semibold uppercase tracking-wide px-2">
                                <span>Exercise</span>
                                <span>Sets</span>
                                <span>Reps</span>
                                <span>Rest</span>
                            </div>
                            {day.exercises.map((te, exIdx) => {
                                const exercise = getExerciseById(te.exerciseId)
                                return (
                                    <div key={exIdx} className="grid grid-cols-[1fr_3rem_4rem_3rem] gap-2 items-center px-2 py-2 rounded-lg hover:bg-surface-light transition text-sm">
                                        <div className="flex items-center gap-2">
                                            <Dumbbell className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-xs">{exercise?.name || te.exerciseId}</p>
                                                {te.notes && <p className="text-[10px] text-text-muted">{te.notes}</p>}
                                            </div>
                                        </div>
                                        <span className="text-text-muted text-xs">{te.sets}</span>
                                        <span className="text-text-muted text-xs">{te.repsMin}-{te.repsMax}</span>
                                        <span className="text-text-muted text-xs">{te.restSeconds}s</span>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
