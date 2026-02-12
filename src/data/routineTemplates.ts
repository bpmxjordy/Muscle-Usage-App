// Rule-based routine templates for the AI Personal Trainer
// Each template maps goal × experience × days to a routine

export interface RoutineTemplate {
    name: string
    description: string
    goal: GoalType
    level: LevelType
    daysPerWeek: number
    days: RoutineDay[]
}

export interface RoutineDay {
    name: string
    focus: string
    exercises: TemplateExercise[]
}

export interface TemplateExercise {
    exerciseId: string
    sets: number
    repsMin: number
    repsMax: number
    restSeconds: number
    notes?: string
}

export type GoalType = 'bodybuilding' | 'calisthenics' | 'climbing' | 'powerlifting' | 'general' | 'weight_loss'
export type LevelType = 'beginner' | 'intermediate' | 'advanced'
export type EquipmentType = 'full_gym' | 'home_gym' | 'bodyweight'

const goalLabels: Record<GoalType, string> = {
    bodybuilding: '🏋️ Bodybuilding',
    calisthenics: '🤸 Calisthenics',
    climbing: '🧗 Rock Climbing',
    powerlifting: '🏆 Powerlifting',
    general: '💪 General Fitness',
    weight_loss: '🔥 Weight Loss',
}

const goalDescriptions: Record<GoalType, string> = {
    bodybuilding: 'Build muscle mass with hypertrophy-focused training',
    calisthenics: 'Master bodyweight movements and skills',
    climbing: 'Build grip strength, endurance, and pulling power',
    powerlifting: 'Maximize strength on squat, bench, and deadlift',
    general: 'Balanced strength, endurance, and flexibility',
    weight_loss: 'Burn fat with high-intensity circuits and compound lifts',
}

const levelLabels: Record<LevelType, string> = {
    beginner: '🌱 Beginner',
    intermediate: '⚡ Intermediate',
    advanced: '🔥 Advanced',
}

export { goalLabels, goalDescriptions, levelLabels }

// ─── Templates ──────────────────────────────────────────────────────────

export function generateRoutine(goal: GoalType, level: LevelType, daysPerWeek: number, equipment: EquipmentType): RoutineTemplate {
    const templates: Record<GoalType, () => RoutineTemplate> = {
        bodybuilding: () => buildBodybuildingRoutine(level, daysPerWeek, equipment),
        calisthenics: () => buildCalisthenicsRoutine(level, daysPerWeek),
        climbing: () => buildClimbingRoutine(level, daysPerWeek),
        powerlifting: () => buildPowerliftingRoutine(level, daysPerWeek),
        general: () => buildGeneralRoutine(level, daysPerWeek, equipment),
        weight_loss: () => buildWeightLossRoutine(level, daysPerWeek, equipment),
    }
    return templates[goal]()
}

function getSets(level: LevelType, base: number): number {
    if (level === 'beginner') return Math.max(base - 1, 2)
    if (level === 'advanced') return base + 1
    return base
}

function buildBodybuildingRoutine(level: LevelType, days: number, equipment: EquipmentType): RoutineTemplate {
    const s = (base: number) => getSets(level, base)
    const useDB = equipment !== 'bodyweight'

    const pushDay: RoutineDay = {
        name: 'Push Day',
        focus: 'Chest, Shoulders, Triceps',
        exercises: [
            { exerciseId: useDB ? 'bench-press' : 'push-up', sets: s(4), repsMin: 6, repsMax: 10, restSeconds: 90 },
            { exerciseId: useDB ? 'db-incline-press' : 'decline-push-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
            { exerciseId: useDB ? 'db-shoulder-press' : 'pike-push-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: useDB ? 'lateral-raise' : 'pike-push-up', sets: s(3), repsMin: 12, repsMax: 15, restSeconds: 45 },
            { exerciseId: useDB ? 'tricep-pushdown' : 'diamond-push-up', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 45 },
            { exerciseId: useDB ? 'pec-deck' : 'push-up', sets: s(3), repsMin: 12, repsMax: 15, restSeconds: 45 },
        ]
    }

    const pullDay: RoutineDay = {
        name: 'Pull Day',
        focus: 'Back, Biceps',
        exercises: [
            { exerciseId: useDB ? 'barbell-row' : 'pull-up', sets: s(4), repsMin: 6, repsMax: 10, restSeconds: 90 },
            { exerciseId: 'pull-up', sets: s(3), repsMin: 6, repsMax: 12, restSeconds: 90 },
            { exerciseId: useDB ? 'seated-cable-row' : 'inverted-row', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: useDB ? 'lat-pulldown' : 'chin-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: useDB ? 'barbell-curl' : 'chin-up', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 45 },
            { exerciseId: 'face-pull', sets: s(3), repsMin: 12, repsMax: 20, restSeconds: 45 },
        ]
    }

    const legDay: RoutineDay = {
        name: 'Leg Day',
        focus: 'Quads, Hamstrings, Glutes, Calves',
        exercises: [
            { exerciseId: useDB ? 'squat' : 'bodyweight-squat', sets: s(4), repsMin: 6, repsMax: 10, restSeconds: 120 },
            { exerciseId: useDB ? 'romanian-deadlift' : 'nordic-curl', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
            { exerciseId: useDB ? 'leg-press' : 'bulgarian-split-squat', sets: s(3), repsMin: 10, repsMax: 12, restSeconds: 90 },
            { exerciseId: useDB ? 'leg-curl' : 'glute-bridge', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
            { exerciseId: useDB ? 'leg-extension' : 'wall-sit', sets: s(3), repsMin: 12, repsMax: 15, restSeconds: 45 },
            { exerciseId: useDB ? 'calf-raise' : 'calf-raise', sets: s(4), repsMin: 12, repsMax: 20, restSeconds: 45 },
        ]
    }

    const routineDays: RoutineDay[] = []
    if (days <= 3) {
        routineDays.push(pushDay, pullDay, legDay)
    } else if (days <= 4) {
        routineDays.push(
            { ...pushDay, name: 'Upper Push' },
            pullDay,
            legDay,
            {
                name: 'Shoulders & Arms', focus: 'Delts, Biceps, Triceps', exercises: [
                    { exerciseId: useDB ? 'overhead-press' : 'handstand-push-up', sets: s(4), repsMin: 6, repsMax: 10, restSeconds: 90 },
                    { exerciseId: useDB ? 'lateral-raise' : 'pike-push-up', sets: s(3), repsMin: 12, repsMax: 15, restSeconds: 45 },
                    { exerciseId: useDB ? 'barbell-curl' : 'chin-up', sets: s(3), repsMin: 10, repsMax: 12, restSeconds: 60 },
                    { exerciseId: useDB ? 'skull-crusher' : 'bench-dip', sets: s(3), repsMin: 10, repsMax: 12, restSeconds: 60 },
                    { exerciseId: 'face-pull', sets: s(3), repsMin: 15, repsMax: 20, restSeconds: 45 },
                ]
            }
        )
    } else {
        routineDays.push(
            {
                name: 'Chest', focus: 'Chest Focus', exercises: [
                    { exerciseId: useDB ? 'bench-press' : 'push-up', sets: s(4), repsMin: 6, repsMax: 10, restSeconds: 90 },
                    { exerciseId: useDB ? 'db-incline-press' : 'decline-push-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
                    { exerciseId: useDB ? 'dumbbell-fly' : 'push-up', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
                    { exerciseId: useDB ? 'cable-crossover' : 'diamond-push-up', sets: s(3), repsMin: 12, repsMax: 15, restSeconds: 45 },
                ]
            },
            {
                name: 'Back', focus: 'Back Focus', exercises: [
                    { exerciseId: useDB ? 'deadlift' : 'pull-up', sets: s(4), repsMin: 3, repsMax: 6, restSeconds: 180 },
                    { exerciseId: useDB ? 'barbell-row' : 'inverted-row', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
                    { exerciseId: useDB ? 'lat-pulldown' : 'chin-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
                    { exerciseId: useDB ? 'seated-cable-row' : 'inverted-row', sets: s(3), repsMin: 10, repsMax: 12, restSeconds: 60 },
                ]
            },
            {
                name: 'Shoulders', focus: 'Delts & Traps', exercises: [
                    { exerciseId: useDB ? 'overhead-press' : 'pike-push-up', sets: s(4), repsMin: 6, repsMax: 10, restSeconds: 90 },
                    { exerciseId: useDB ? 'lateral-raise' : 'pike-push-up', sets: s(4), repsMin: 12, repsMax: 15, restSeconds: 45 },
                    { exerciseId: 'rear-delt-fly', sets: s(3), repsMin: 12, repsMax: 15, restSeconds: 45 },
                    { exerciseId: useDB ? 'barbell-shrug' : 'dead-hang', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
                ]
            },
            legDay,
            {
                name: 'Arms', focus: 'Biceps & Triceps', exercises: [
                    { exerciseId: useDB ? 'barbell-curl' : 'chin-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
                    { exerciseId: useDB ? 'skull-crusher' : 'bench-dip', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
                    { exerciseId: useDB ? 'hammer-curl' : 'chin-up', sets: s(3), repsMin: 10, repsMax: 12, restSeconds: 45 },
                    { exerciseId: useDB ? 'overhead-tricep-ext' : 'diamond-push-up', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 45 },
                    { exerciseId: useDB ? 'concentration-curl' : 'chin-up', sets: s(2), repsMin: 12, repsMax: 15, restSeconds: 45 },
                ]
            },
        )
        if (days >= 6) {
            routineDays.push({
                name: 'Core & Conditioning', focus: 'Abs, Cardio', exercises: [
                    { exerciseId: 'hanging-leg-raise', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
                    { exerciseId: 'russian-twist', sets: s(3), repsMin: 15, repsMax: 20, restSeconds: 45 },
                    { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 60, restSeconds: 45, notes: 'seconds hold' },
                    { exerciseId: 'mountain-climber', sets: s(3), repsMin: 15, repsMax: 20, restSeconds: 30 },
                    { exerciseId: 'burpee', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
                ]
            })
        }
    }

    return {
        name: `${level === 'beginner' ? 'Foundation' : level === 'intermediate' ? 'Hypertrophy' : 'Advanced Hypertrophy'} Split`,
        description: `A ${days}-day ${level} bodybuilding program focused on progressive overload and muscle hypertrophy.`,
        goal: 'bodybuilding',
        level,
        daysPerWeek: days,
        days: routineDays.slice(0, days),
    }
}

function buildCalisthenicsRoutine(level: LevelType, days: number): RoutineTemplate {
    const s = (base: number) => getSets(level, base)
    const isAdv = level === 'advanced'

    const upper: RoutineDay = {
        name: 'Upper Body',
        focus: 'Push & Pull Skills',
        exercises: [
            { exerciseId: isAdv ? 'muscle-up' : 'pull-up', sets: s(4), repsMin: 3, repsMax: 8, restSeconds: 120 },
            { exerciseId: 'dip', sets: s(4), repsMin: 6, repsMax: 12, restSeconds: 90 },
            { exerciseId: isAdv ? 'handstand-push-up' : 'pike-push-up', sets: s(3), repsMin: 5, repsMax: 10, restSeconds: 90 },
            { exerciseId: 'inverted-row', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: 'diamond-push-up', sets: s(3), repsMin: 8, repsMax: 15, restSeconds: 60 },
            { exerciseId: isAdv ? 'l-sit' : 'plank', sets: 3, repsMin: 15, repsMax: 30, restSeconds: 60, notes: 'seconds hold' },
        ]
    }

    const lower: RoutineDay = {
        name: 'Lower Body',
        focus: 'Legs & Core',
        exercises: [
            { exerciseId: isAdv ? 'pistol-squat' : 'bodyweight-squat', sets: s(4), repsMin: 5, repsMax: 12, restSeconds: 90 },
            { exerciseId: 'bulgarian-split-squat', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
            { exerciseId: 'nordic-curl', sets: s(3), repsMin: 3, repsMax: 8, restSeconds: 90 },
            { exerciseId: 'glute-bridge', sets: s(3), repsMin: 12, repsMax: 20, restSeconds: 60 },
            { exerciseId: 'hanging-leg-raise', sets: s(3), repsMin: 8, repsMax: 15, restSeconds: 60 },
            { exerciseId: isAdv ? 'dragon-flag' : 'bicycle-crunch', sets: s(3), repsMin: 6, repsMax: 12, restSeconds: 60 },
        ]
    }

    const skills: RoutineDay = {
        name: 'Skill Day',
        focus: 'Static Holds & Advanced Movements',
        exercises: [
            { exerciseId: isAdv ? 'front-lever' : 'dead-hang', sets: s(4), repsMin: 5, repsMax: 15, restSeconds: 120, notes: 'seconds hold or tuck progressions' },
            { exerciseId: isAdv ? 'planche' : 'push-up', sets: s(4), repsMin: 5, repsMax: 15, restSeconds: 120, notes: 'lean progressions' },
            { exerciseId: isAdv ? 'muscle-up' : 'pull-up', sets: s(3), repsMin: 3, repsMax: 6, restSeconds: 120 },
            { exerciseId: isAdv ? 'handstand-push-up' : 'pike-push-up', sets: s(3), repsMin: 3, repsMax: 8, restSeconds: 90 },
            { exerciseId: 'l-sit', sets: 3, repsMin: 10, repsMax: 30, restSeconds: 60, notes: 'seconds hold' },
        ]
    }

    const allDays = days <= 3 ? [upper, lower, skills] : [upper, lower, skills, { ...upper, name: 'Upper Body 2' }, { ...lower, name: 'Lower Body 2' }, { ...skills, name: 'Skills 2' }]

    return {
        name: `${level === 'beginner' ? 'Foundation' : level === 'intermediate' ? 'Progressive' : 'Advanced'} Calisthenics`,
        description: `A ${days}-day calisthenics program focusing on bodyweight mastery${isAdv ? ' with advanced static holds' : ''}.`,
        goal: 'calisthenics',
        level,
        daysPerWeek: days,
        days: allDays.slice(0, days),
    }
}

function buildClimbingRoutine(level: LevelType, days: number): RoutineTemplate {
    const s = (base: number) => getSets(level, base)
    const isAdv = level === 'advanced'

    const pullStrength: RoutineDay = {
        name: 'Pull Strength',
        focus: 'Pulling Power & Grip',
        exercises: [
            { exerciseId: isAdv ? 'campus-board' : 'pull-up', sets: s(4), repsMin: 3, repsMax: 8, restSeconds: 120 },
            { exerciseId: 'lock-off', sets: s(3), repsMin: 5, repsMax: 10, restSeconds: 90, notes: 'seconds hold at 90°' },
            { exerciseId: 'inverted-row', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: 'fingerboard-hang', sets: s(4), repsMin: 7, repsMax: 10, restSeconds: 120, notes: 'seconds per hang' },
            { exerciseId: 'dead-hang', sets: s(3), repsMin: 20, repsMax: 45, restSeconds: 90, notes: 'seconds' },
            { exerciseId: 'wrist-curl', sets: s(3), repsMin: 12, repsMax: 20, restSeconds: 45 },
        ]
    }

    const antagonist: RoutineDay = {
        name: 'Antagonist & Core',
        focus: 'Push Muscles & Core Stability',
        exercises: [
            { exerciseId: 'push-up', sets: s(3), repsMin: 10, repsMax: 20, restSeconds: 60 },
            { exerciseId: 'dip', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: 'pike-push-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: isAdv ? 'front-lever' : 'hanging-leg-raise', sets: s(3), repsMin: 5, repsMax: 12, restSeconds: 90 },
            { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 60, restSeconds: 45, notes: 'seconds hold' },
            { exerciseId: 'side-plank', sets: 3, repsMin: 20, repsMax: 40, restSeconds: 45, notes: 'seconds each side' },
        ]
    }

    const power: RoutineDay = {
        name: 'Power & Endurance',
        focus: 'Explosive Pulling & Stamina',
        exercises: [
            { exerciseId: isAdv ? 'muscle-up' : 'pull-up', sets: s(4), repsMin: 3, repsMax: 6, restSeconds: 120, notes: 'explosive' },
            { exerciseId: 'chin-up', sets: s(3), repsMin: 6, repsMax: 12, restSeconds: 90 },
            { exerciseId: 'fingerboard-hang', sets: s(3), repsMin: 7, repsMax: 10, restSeconds: 120, notes: 'different grips' },
            { exerciseId: 'farmer-walk', sets: s(3), repsMin: 30, repsMax: 60, restSeconds: 90, notes: 'seconds' },
            { exerciseId: 'bodyweight-squat', sets: s(3), repsMin: 15, repsMax: 25, restSeconds: 45 },
            { exerciseId: 'russian-twist', sets: s(3), repsMin: 15, repsMax: 20, restSeconds: 45 },
        ]
    }

    const allDays = [pullStrength, antagonist, power, { ...pullStrength, name: 'Pull Strength 2' }, { ...antagonist, name: 'Antagonist 2' }, { ...power, name: 'Power 2' }]

    return {
        name: `${level === 'beginner' ? 'Foundation' : level === 'intermediate' ? 'Performance' : 'Send'} Climbing Program`,
        description: `A ${days}-day climbing-specific program to build grip strength, pulling power, and antagonist balance.`,
        goal: 'climbing',
        level,
        daysPerWeek: days,
        days: allDays.slice(0, days),
    }
}

function buildPowerliftingRoutine(level: LevelType, days: number): RoutineTemplate {
    const s = (base: number) => getSets(level, base)

    const squatDay: RoutineDay = {
        name: 'Squat Day',
        focus: 'Squat & Quad Accessories',
        exercises: [
            { exerciseId: 'squat', sets: s(5), repsMin: 3, repsMax: 5, restSeconds: 180 },
            { exerciseId: 'front-squat', sets: s(3), repsMin: 5, repsMax: 8, restSeconds: 120 },
            { exerciseId: 'leg-press', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
            { exerciseId: 'leg-extension', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
            { exerciseId: 'hanging-leg-raise', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
        ]
    }

    const benchDay: RoutineDay = {
        name: 'Bench Day',
        focus: 'Bench Press & Upper Body Accessories',
        exercises: [
            { exerciseId: 'bench-press', sets: s(5), repsMin: 3, repsMax: 5, restSeconds: 180 },
            { exerciseId: 'close-grip-bench', sets: s(3), repsMin: 6, repsMax: 10, restSeconds: 120 },
            { exerciseId: 'db-incline-press', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
            { exerciseId: 'barbell-row', sets: s(3), repsMin: 6, repsMax: 10, restSeconds: 90 },
            { exerciseId: 'tricep-pushdown', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
        ]
    }

    const deadliftDay: RoutineDay = {
        name: 'Deadlift Day',
        focus: 'Deadlift & Posterior Chain',
        exercises: [
            { exerciseId: 'deadlift', sets: s(4), repsMin: 2, repsMax: 5, restSeconds: 240 },
            { exerciseId: 'romanian-deadlift', sets: s(3), repsMin: 6, repsMax: 10, restSeconds: 120 },
            { exerciseId: 'barbell-row', sets: s(3), repsMin: 6, repsMax: 10, restSeconds: 90 },
            { exerciseId: 'pull-up', sets: s(3), repsMin: 6, repsMax: 10, restSeconds: 90 },
            { exerciseId: 'barbell-shrug', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
        ]
    }

    const accessoryDay: RoutineDay = {
        name: 'Accessory Day',
        focus: 'Weak Points & Hypertrophy',
        exercises: [
            { exerciseId: 'overhead-press', sets: s(4), repsMin: 5, repsMax: 8, restSeconds: 120 },
            { exerciseId: 'lat-pulldown', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: 'face-pull', sets: s(3), repsMin: 15, repsMax: 20, restSeconds: 45 },
            { exerciseId: 'barbell-curl', sets: s(3), repsMin: 10, repsMax: 12, restSeconds: 60 },
            { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 60, restSeconds: 45, notes: 'seconds hold' },
        ]
    }

    const allDays = [squatDay, benchDay, deadliftDay, accessoryDay, { ...squatDay, name: 'Squat Variation' }, { ...benchDay, name: 'Bench Variation' }]

    return {
        name: `${level === 'beginner' ? 'Starting Strength' : level === 'intermediate' ? 'Intermediate' : 'Advanced'} Powerlifting`,
        description: `A ${days}-day powerlifting program that prioritizes the big 3 lifts with progressive overload.`,
        goal: 'powerlifting',
        level,
        daysPerWeek: days,
        days: allDays.slice(0, days),
    }
}

function buildGeneralRoutine(level: LevelType, days: number, equipment: EquipmentType): RoutineTemplate {
    const s = (base: number) => getSets(level, base)
    const useDB = equipment !== 'bodyweight'

    const fullBodyA: RoutineDay = {
        name: 'Full Body A',
        focus: 'Push Emphasis',
        exercises: [
            { exerciseId: useDB ? 'squat' : 'bodyweight-squat', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
            { exerciseId: useDB ? 'bench-press' : 'push-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 90 },
            { exerciseId: useDB ? 'db-row' : 'inverted-row', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: useDB ? 'overhead-press' : 'pike-push-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 60, restSeconds: 45, notes: 'seconds hold' },
        ]
    }

    const fullBodyB: RoutineDay = {
        name: 'Full Body B',
        focus: 'Pull Emphasis',
        exercises: [
            { exerciseId: useDB ? 'deadlift' : 'glute-bridge', sets: s(3), repsMin: 6, repsMax: 10, restSeconds: 120 },
            { exerciseId: 'pull-up', sets: s(3), repsMin: 5, repsMax: 10, restSeconds: 90 },
            { exerciseId: useDB ? 'db-bench-press' : 'push-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: useDB ? 'lunge' : 'walking-lunge', sets: s(3), repsMin: 10, repsMax: 12, restSeconds: 60 },
            { exerciseId: 'hanging-leg-raise', sets: s(3), repsMin: 8, repsMax: 15, restSeconds: 60 },
        ]
    }

    const fullBodyC: RoutineDay = {
        name: 'Full Body C',
        focus: 'Balanced',
        exercises: [
            { exerciseId: useDB ? 'goblet-squat' : 'bodyweight-squat', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 60 },
            { exerciseId: useDB ? 'barbell-row' : 'inverted-row', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: useDB ? 'db-shoulder-press' : 'pike-push-up', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: useDB ? 'romanian-deadlift' : 'nordic-curl', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 60 },
            { exerciseId: 'russian-twist', sets: s(3), repsMin: 15, repsMax: 20, restSeconds: 45 },
        ]
    }

    const allDays = [fullBodyA, fullBodyB, fullBodyC, { ...fullBodyA, name: 'Full Body D' }, { ...fullBodyB, name: 'Full Body E' }, { ...fullBodyC, name: 'Full Body F' }]

    return {
        name: `${level === 'beginner' ? 'Starter' : level === 'intermediate' ? 'Balanced' : 'Performance'} Fitness`,
        description: `A ${days}-day balanced fitness program for overall strength, endurance, and health.`,
        goal: 'general',
        level,
        daysPerWeek: days,
        days: allDays.slice(0, days),
    }
}

function buildWeightLossRoutine(level: LevelType, days: number, equipment: EquipmentType): RoutineTemplate {
    const s = (base: number) => getSets(level, base)
    const useDB = equipment !== 'bodyweight'

    const circuitA: RoutineDay = {
        name: 'Circuit A',
        focus: 'Upper Body + Cardio Burn',
        exercises: [
            { exerciseId: useDB ? 'bench-press' : 'push-up', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 30 },
            { exerciseId: 'burpee', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 30 },
            { exerciseId: useDB ? 'barbell-row' : 'inverted-row', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 30 },
            { exerciseId: 'mountain-climber', sets: s(3), repsMin: 15, repsMax: 25, restSeconds: 30 },
            { exerciseId: useDB ? 'overhead-press' : 'pike-push-up', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 30 },
            { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 60, restSeconds: 30, notes: 'seconds hold' },
        ]
    }

    const circuitB: RoutineDay = {
        name: 'Circuit B',
        focus: 'Lower Body + Cardio Burn',
        exercises: [
            { exerciseId: useDB ? 'squat' : 'bodyweight-squat', sets: s(3), repsMin: 12, repsMax: 20, restSeconds: 30 },
            { exerciseId: 'box-jump', sets: s(3), repsMin: 8, repsMax: 12, restSeconds: 30 },
            { exerciseId: 'lunge', sets: s(3), repsMin: 10, repsMax: 15, restSeconds: 30, notes: 'each leg' },
            { exerciseId: useDB ? 'kettlebell-swing' : 'burpee', sets: s(3), repsMin: 12, repsMax: 20, restSeconds: 30 },
            { exerciseId: 'glute-bridge', sets: s(3), repsMin: 15, repsMax: 25, restSeconds: 30 },
            { exerciseId: 'bicycle-crunch', sets: s(3), repsMin: 15, repsMax: 25, restSeconds: 30 },
        ]
    }

    const circuitC: RoutineDay = {
        name: 'Circuit C',
        focus: 'Full Body HIIT',
        exercises: [
            { exerciseId: useDB ? 'thruster' : 'burpee', sets: s(4), repsMin: 8, repsMax: 12, restSeconds: 30 },
            { exerciseId: 'pull-up', sets: s(3), repsMin: 5, repsMax: 10, restSeconds: 45 },
            { exerciseId: 'push-up', sets: s(3), repsMin: 12, repsMax: 20, restSeconds: 30 },
            { exerciseId: 'bodyweight-squat', sets: s(3), repsMin: 15, repsMax: 25, restSeconds: 30 },
            { exerciseId: 'mountain-climber', sets: s(3), repsMin: 20, repsMax: 30, restSeconds: 30 },
            { exerciseId: 'russian-twist', sets: s(3), repsMin: 15, repsMax: 20, restSeconds: 30 },
        ]
    }

    const allDays = [circuitA, circuitB, circuitC, { ...circuitA, name: 'Circuit D' }, { ...circuitB, name: 'Circuit E' }, { ...circuitC, name: 'Circuit F' }]

    return {
        name: `${level === 'beginner' ? 'Kickstart' : level === 'intermediate' ? 'Shred' : 'Elite'} Fat Burn`,
        description: `A ${days}-day circuit-based program with minimal rest to maximize calorie burn and build lean muscle.`,
        goal: 'weight_loss',
        level,
        daysPerWeek: days,
        days: allDays.slice(0, days),
    }
}
