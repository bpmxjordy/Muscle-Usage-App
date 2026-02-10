import type { Exercise } from '../types'

export const exercises: Exercise[] = [
    // ─── Chest ───────────────────────────────────────────────────────
    {
        id: 'bench-press',
        name: 'Barbell Bench Press',
        category: 'compound',
        equipment: 'Barbell, Bench',
        primary_muscles: ['chest'],
        secondary_muscles: ['front_delts', 'triceps'],
        instructions: 'Lie on a flat bench, grip the barbell slightly wider than shoulder-width. Lower to mid-chest, then press up.',
    },
    {
        id: 'incline-bench-press',
        name: 'Incline Barbell Bench Press',
        category: 'compound',
        equipment: 'Barbell, Incline Bench',
        primary_muscles: ['chest'],
        secondary_muscles: ['front_delts', 'triceps'],
        instructions: 'Set bench to 30-45°. Lower barbell to upper chest, then press up.',
    },
    {
        id: 'dumbbell-fly',
        name: 'Dumbbell Fly',
        category: 'isolation',
        equipment: 'Dumbbells, Bench',
        primary_muscles: ['chest'],
        secondary_muscles: ['front_delts'],
        instructions: 'Lie flat, extend dumbbells above chest. Lower with a slight bend in elbows, then bring back together.',
    },
    {
        id: 'cable-crossover',
        name: 'Cable Crossover',
        category: 'isolation',
        equipment: 'Cable Machine',
        primary_muscles: ['chest'],
        secondary_muscles: ['front_delts'],
    },

    // ─── Back ────────────────────────────────────────────────────────
    {
        id: 'deadlift',
        name: 'Conventional Deadlift',
        category: 'compound',
        equipment: 'Barbell',
        primary_muscles: ['lower_back', 'hamstrings', 'glutes'],
        secondary_muscles: ['upper_back', 'traps', 'forearms', 'quads'],
        instructions: 'Stand with feet hip-width. Hinge at hips, grip bar. Drive through heels, extending hips and knees.',
    },
    {
        id: 'barbell-row',
        name: 'Barbell Bent-Over Row',
        category: 'compound',
        equipment: 'Barbell',
        primary_muscles: ['upper_back', 'lats'],
        secondary_muscles: ['biceps', 'rear_delts', 'forearms'],
        instructions: 'Hinge forward about 45°, pull barbell to lower chest/upper abs.',
    },
    {
        id: 'pull-up',
        name: 'Pull-Up',
        category: 'compound',
        equipment: 'Pull-Up Bar',
        primary_muscles: ['lats', 'upper_back'],
        secondary_muscles: ['biceps', 'forearms'],
        instructions: 'Hang from bar with overhand grip, pull chin above bar.',
    },
    {
        id: 'lat-pulldown',
        name: 'Lat Pulldown',
        category: 'compound',
        equipment: 'Cable Machine',
        primary_muscles: ['lats'],
        secondary_muscles: ['biceps', 'upper_back'],
    },
    {
        id: 'seated-cable-row',
        name: 'Seated Cable Row',
        category: 'compound',
        equipment: 'Cable Machine',
        primary_muscles: ['upper_back', 'lats'],
        secondary_muscles: ['biceps', 'rear_delts'],
    },

    // ─── Shoulders ───────────────────────────────────────────────────
    {
        id: 'overhead-press',
        name: 'Overhead Press',
        category: 'compound',
        equipment: 'Barbell',
        primary_muscles: ['front_delts', 'side_delts'],
        secondary_muscles: ['triceps', 'traps', 'upper_back'],
        instructions: 'Press barbell overhead from shoulder level to full lockout.',
    },
    {
        id: 'lateral-raise',
        name: 'Dumbbell Lateral Raise',
        category: 'isolation',
        equipment: 'Dumbbells',
        primary_muscles: ['side_delts'],
        secondary_muscles: ['traps'],
    },
    {
        id: 'face-pull',
        name: 'Face Pull',
        category: 'isolation',
        equipment: 'Cable Machine',
        primary_muscles: ['rear_delts'],
        secondary_muscles: ['upper_back', 'traps'],
    },

    // ─── Arms ────────────────────────────────────────────────────────
    {
        id: 'barbell-curl',
        name: 'Barbell Curl',
        category: 'isolation',
        equipment: 'Barbell',
        primary_muscles: ['biceps'],
        secondary_muscles: ['forearms'],
    },
    {
        id: 'hammer-curl',
        name: 'Hammer Curl',
        category: 'isolation',
        equipment: 'Dumbbells',
        primary_muscles: ['biceps', 'forearms'],
        secondary_muscles: [],
    },
    {
        id: 'tricep-pushdown',
        name: 'Tricep Pushdown',
        category: 'isolation',
        equipment: 'Cable Machine',
        primary_muscles: ['triceps'],
        secondary_muscles: [],
    },
    {
        id: 'skull-crusher',
        name: 'Skull Crusher',
        category: 'isolation',
        equipment: 'Barbell / EZ Bar, Bench',
        primary_muscles: ['triceps'],
        secondary_muscles: [],
    },

    // ─── Legs ────────────────────────────────────────────────────────
    {
        id: 'squat',
        name: 'Barbell Back Squat',
        category: 'compound',
        equipment: 'Barbell, Squat Rack',
        primary_muscles: ['quads', 'glutes'],
        secondary_muscles: ['hamstrings', 'lower_back', 'abs'],
        instructions: 'Bar on upper back, squat until thighs are parallel, then stand.',
    },
    {
        id: 'front-squat',
        name: 'Front Squat',
        category: 'compound',
        equipment: 'Barbell, Squat Rack',
        primary_muscles: ['quads'],
        secondary_muscles: ['glutes', 'abs', 'upper_back'],
    },
    {
        id: 'leg-press',
        name: 'Leg Press',
        category: 'compound',
        equipment: 'Leg Press Machine',
        primary_muscles: ['quads', 'glutes'],
        secondary_muscles: ['hamstrings'],
    },
    {
        id: 'romanian-deadlift',
        name: 'Romanian Deadlift',
        category: 'compound',
        equipment: 'Barbell',
        primary_muscles: ['hamstrings', 'glutes'],
        secondary_muscles: ['lower_back', 'forearms'],
    },
    {
        id: 'leg-curl',
        name: 'Leg Curl',
        category: 'isolation',
        equipment: 'Leg Curl Machine',
        primary_muscles: ['hamstrings'],
        secondary_muscles: [],
    },
    {
        id: 'leg-extension',
        name: 'Leg Extension',
        category: 'isolation',
        equipment: 'Leg Extension Machine',
        primary_muscles: ['quads'],
        secondary_muscles: [],
    },
    {
        id: 'calf-raise',
        name: 'Standing Calf Raise',
        category: 'isolation',
        equipment: 'Calf Raise Machine / Smith Machine',
        primary_muscles: ['calves'],
        secondary_muscles: [],
    },

    // ─── Core ────────────────────────────────────────────────────────
    {
        id: 'plank',
        name: 'Plank',
        category: 'isolation',
        equipment: 'Bodyweight',
        primary_muscles: ['abs'],
        secondary_muscles: ['obliques', 'lower_back'],
    },
    {
        id: 'cable-crunch',
        name: 'Cable Crunch',
        category: 'isolation',
        equipment: 'Cable Machine',
        primary_muscles: ['abs'],
        secondary_muscles: ['obliques'],
    },
    {
        id: 'hanging-leg-raise',
        name: 'Hanging Leg Raise',
        category: 'isolation',
        equipment: 'Pull-Up Bar',
        primary_muscles: ['abs', 'obliques'],
        secondary_muscles: ['forearms'],
    },
]

export function getExerciseById(id: string): Exercise | undefined {
    return exercises.find((e) => e.id === id)
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
    return exercises.filter(
        (e) =>
            e.primary_muscles.includes(muscle as any) ||
            e.secondary_muscles.includes(muscle as any)
    )
}
