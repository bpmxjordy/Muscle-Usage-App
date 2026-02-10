import { useState, useMemo } from 'react'
import { useWorkoutStore } from '../stores/workoutStore'
import type { MuscleGroup, MuscleUsageData, AISuggestion } from '../types'
import {
    BarChart3,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    Award,
    Calendar,
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import { motion } from 'framer-motion'

// ─── Muscle Heatmap SVG Component ────────────────────────────────────
// SVG Paths for a 400x400 viewing area (Front ~100x, Back ~300x)
const MUSCLE_CONFIG: Record<MuscleGroup, { path: string; label: string }> = {
    // ── FRONT VIEW ──
    neck: { path: "M92,35 Q100,42 108,35 L108,50 Q100,55 92,50 Z", label: 'Neck' },
    traps: { path: "M75,55 L92,50 L108,50 L125,55 L115,65 L85,65 Z", label: 'Traps' },
    front_delts: { path: "M55,65 Q65,60 75,65 L70,85 Q55,80 50,70 Z M125,65 Q135,60 145,65 L150,70 Q145,80 130,85 L125,65 Z", label: 'Front Delts' },
    side_delts: { path: "M45,70 Q55,65 60,75 L55,95 Q40,85 45,70 Z M140,75 Q145,65 155,70 Q160,85 145,95 L140,75 Z", label: 'Side Delts' },
    chest: { path: "M75,70 Q100,75 125,70 L120,95 Q100,105 80,95 Z", label: 'Chest' },
    biceps: { path: "M55,95 Q65,100 62,130 L48,130 Q45,100 55,95 Z M145,95 Q155,100 152,130 L138,130 Q135,100 145,95 Z", label: 'Biceps' },
    forearms: { path: "M45,135 Q58,140 55,170 L42,170 Q40,140 45,135 Z M145,170 Q142,140 155,135 Q160,140 158,170 Z", label: 'Forearms' },
    abs: { path: "M85,100 L115,100 L112,150 Q100,155 88,150 Z", label: 'Abs' },
    obliques: { path: "M70,100 L85,100 L88,150 L75,145 Z M125,145 L112,150 L115,100 L130,100 Z", label: 'Obliques' },
    quads: { path: "M70,165 Q85,160 100,165 L95,230 Q85,235 75,230 Z M100,165 Q115,160 130,165 L125,230 Q115,235 105,230 Z", label: 'Quads' },
    calves: { path: "M70,240 Q85,245 80,290 L70,290 Q65,245 70,240 Z M120,290 Q115,245 130,240 Q135,245 130,290 Z", label: 'Calves' },

    // ── BACK VIEW ──
    rear_delts: { path: "M245,70 Q255,65 260,75 L255,90 Q245,85 245,70 Z M340,75 Q345,65 355,70 Q355,85 345,90 L340,75 Z", label: 'Rear Delts' },
    upper_back: { path: "M260,70 L340,70 L330,110 Q300,120 270,110 Z", label: 'Upper Back' },
    lats: { path: "M260,110 L270,110 L280,155 L260,145 Z M340,110 L330,110 L320,155 L340,145 Z", label: 'Lats' },
    triceps: { path: "M245,95 Q255,100 252,130 L238,130 Q235,100 245,95 Z M345,95 Q355,100 352,130 L338,130 Q335,100 345,95 Z", label: 'Triceps' },
    lower_back: { path: "M280,120 L320,120 L315,155 Q300,160 285,155 Z", label: 'Lower Back' },
    glutes: { path: "M275,160 Q300,160 325,160 L320,195 Q300,205 280,195 Z", label: 'Glutes' },
    hamstrings: { path: "M275,200 Q290,205 285,235 L275,235 Z M325,200 Q310,205 315,235 L325,235 Z", label: 'Hamstrings' },
}

function getHeatColor(intensity: number): string {
    if (intensity === 0) return '#2a2740'
    if (intensity < 0.25) return '#1e3a5f'
    if (intensity < 0.5) return '#1a5276'
    if (intensity < 0.75) return '#f59e0b'
    return '#ef4444'
}

function MuscleHeatmap({ data }: { data: MuscleUsageData[] }) {
    const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null)
    const dataMap = useMemo(() => {
        const map: Partial<Record<MuscleGroup, MuscleUsageData>> = {}
        data.forEach((d) => (map[d.muscle] = d))
        return map
    }, [data])

    return (
        <div className="relative">
            <svg viewBox="0 0 400 320" className="w-full max-w-lg mx-auto">
                {/* Labels */}
                <text x="100" y="18" className="fill-text-muted text-[11px] font-semibold" textAnchor="middle">FRONT</text>
                <text x="300" y="18" className="fill-text-muted text-[11px] font-semibold" textAnchor="middle">BACK</text>

                {/* Divider */}
                <line x1="200" y1="26" x2="200" y2="310" stroke="#334155" strokeWidth="1" strokeDasharray="5 4" />

                {/* Body Outline (Silhouettes) */}
                {/* Front Head */}
                <circle cx="100" cy="30" r="14" fill="#1e1b2e" stroke="#334155" />
                {/* Back Head */}
                <circle cx="300" cy="30" r="14" fill="#1e1b2e" stroke="#334155" />

                {/* Muscle groups overlay */}
                {(Object.entries(MUSCLE_CONFIG) as [MuscleGroup, typeof MUSCLE_CONFIG[MuscleGroup]][]).map(
                    ([muscle, config]) => {
                        const muscleData = dataMap[muscle]
                        const intensity = muscleData?.intensity || 0
                        const isHovered = hoveredMuscle === muscle

                        return (
                            <path
                                key={muscle}
                                d={config.path}
                                fill={getHeatColor(intensity)}
                                stroke={isHovered ? '#f1f5f9' : '#1e1b2e'}
                                strokeWidth={isHovered ? 2 : 1}
                                className="cursor-pointer transition-all duration-200 hover:opacity-100"
                                style={{ opacity: intensity > 0 ? 1 : 0.4 }}
                                onMouseEnter={() => setHoveredMuscle(muscle)}
                                onMouseLeave={() => setHoveredMuscle(null)}
                            />
                        )
                    }
                )}
            </svg>

            {/* Hover tooltip */}
            {hoveredMuscle && dataMap[hoveredMuscle] && (
                <div className="absolute top-4 right-4 bg-surface-light border border-border rounded-xl p-3 shadow-xl text-sm z-50 pointer-events-none">
                    <p className="font-bold">{MUSCLE_CONFIG[hoveredMuscle].label}</p>
                    <p className="text-text-muted">
                        Volume: {dataMap[hoveredMuscle]!.total_volume.toLocaleString()} kg
                    </p>
                    <p className="text-text-muted">
                        Sets: {dataMap[hoveredMuscle]!.total_sets}
                    </p>
                    <p className="text-text-muted">
                        Share: {dataMap[hoveredMuscle]!.percentage}%
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: '#2a2740' }} />
                    None
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: '#1e3a5f' }} />
                    Low
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: '#1a5276' }} />
                    Medium
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: '#f59e0b' }} />
                    High
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: '#ef4444' }} />
                    Max
                </div>
            </div>
        </div>
    )
}

// ─── AI Suggestions Generator ──────────────────────────────────────
function generateSuggestions(muscleData: MuscleUsageData[]): AISuggestion[] {
    const suggestions: AISuggestion[] = []

    if (muscleData.length === 0) {
        suggestions.push({
            id: '1',
            type: 'routine',
            title: 'Start Logging Workouts',
            description: 'Begin tracking your workouts to receive personalized AI suggestions based on your training patterns.',
            priority: 'high',
            reasoning: 'No workout data available yet for analysis.',
        })
        return suggestions
    }

    // Check for muscle imbalances
    const muscleSet = new Set(muscleData.map((d) => d.muscle))
    const neglectedMuscles: MuscleGroup[] = []
    const allMuscles: MuscleGroup[] = ['chest', 'upper_back', 'lats', 'quads', 'hamstrings', 'glutes', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'abs', 'calves']

    allMuscles.forEach((m) => {
        if (!muscleSet.has(m)) neglectedMuscles.push(m)
    })

    if (neglectedMuscles.length > 0) {
        suggestions.push({
            id: 'neglected',
            type: 'exercise',
            title: `Neglected Muscle Groups Detected`,
            description: `You haven't trained: ${neglectedMuscles.map((m) => m.replace('_', ' ')).join(', ')}. Consider adding exercises for these groups to maintain balanced development.`,
            priority: 'high',
            reasoning: 'Muscle imbalances can lead to injuries and plateau in progress.',
        })
    }

    // Check push/pull balance
    const pushVolume = muscleData
        .filter((d) => ['chest', 'front_delts', 'triceps'].includes(d.muscle))
        .reduce((a, d) => a + d.total_volume, 0)
    const pullVolume = muscleData
        .filter((d) => ['upper_back', 'lats', 'biceps', 'rear_delts'].includes(d.muscle))
        .reduce((a, d) => a + d.total_volume, 0)

    if (pushVolume > pullVolume * 1.5) {
        suggestions.push({
            id: 'push-pull',
            type: 'routine',
            title: 'Push/Pull Imbalance',
            description: `Your push volume (${pushVolume.toLocaleString()} kg) significantly exceeds pull volume (${pullVolume.toLocaleString()} kg). Add more rows, pull-ups, and rear delt work.`,
            priority: 'medium',
            reasoning: 'A balanced push-to-pull ratio helps prevent shoulder injuries.',
        })
    }

    // Lower body check
    const lowerVolume = muscleData
        .filter((d) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(d.muscle))
        .reduce((a, d) => a + d.total_volume, 0)
    const upperVolume = muscleData
        .filter((d) => !['quads', 'hamstrings', 'glutes', 'calves'].includes(d.muscle))
        .reduce((a, d) => a + d.total_volume, 0)

    if (upperVolume > lowerVolume * 2) {
        suggestions.push({
            id: 'upper-lower',
            type: 'exercise',
            title: 'Don\'t Skip Leg Day!',
            description: `Your upper body volume is significantly higher than lower body. Add squats, deadlifts, and leg presses to your routine.`,
            priority: 'medium',
            reasoning: 'Balanced upper/lower development supports overall strength and athleticism.',
        })
    }

    // Volume suggestion
    const topMuscle = muscleData[0]
    if (topMuscle && topMuscle.percentage > 30) {
        suggestions.push({
            id: 'overtraining',
            type: 'recovery',
            title: `${topMuscle.muscle.replace('_', ' ')} May Be Overtrained`,
            description: `${topMuscle.muscle.replace('_', ' ')} accounts for ${topMuscle.percentage}% of your total volume. Consider redistributing volume to other muscle groups.`,
            priority: 'low',
            reasoning: 'Excessive volume on one muscle can lead to overtraining and diminishing returns.',
        })
    }

    return suggestions
}

// ─── Colors for charts ─────────────────────────────────────────────
const CHART_COLORS = [
    '#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

export default function AnalyticsPage() {
    const { getMuscleUsage, workouts, personalRecords } = useWorkoutStore()
    const [timeRange, setTimeRange] = useState(30)

    const muscleData = getMuscleUsage(timeRange)
    const suggestions = useMemo(() => generateSuggestions(muscleData), [muscleData])

    // Workout frequency data
    const frequencyData = useMemo(() => {
        const days: Record<string, number> = {}
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - timeRange)

        workouts
            .filter((w) => new Date(w.started_at) >= cutoff)
            .forEach((w) => {
                const day = new Date(w.started_at).toLocaleDateString('en', { weekday: 'short' })
                days[day] = (days[day] || 0) + 1
            })

        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({
            day: d,
            workouts: days[d] || 0,
        }))
    }, [workouts, timeRange])

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Analytics & AI Insights</h1>
                    <p className="text-text-muted">Data-driven training intelligence</p>
                </div>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-1">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setTimeRange(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${timeRange === d
                                ? 'bg-primary text-white'
                                : 'text-text-muted hover:text-text'
                                }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Suggestions */}
            <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-accent" /> AI Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestions.map((s) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-surface border rounded-xl p-4 ${s.priority === 'high'
                                ? 'border-danger/40'
                                : s.priority === 'medium'
                                    ? 'border-accent/40'
                                    : 'border-border'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.priority === 'high'
                                        ? 'bg-danger/15'
                                        : s.priority === 'medium'
                                            ? 'bg-accent/15'
                                            : 'bg-primary/15'
                                        }`}
                                >
                                    {s.priority === 'high' ? (
                                        <AlertTriangle className="w-4 h-4 text-danger" />
                                    ) : (
                                        <Lightbulb className="w-4 h-4 text-accent" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{s.title}</p>
                                    <p className="text-xs text-text-muted mt-1">{s.description}</p>
                                    <p className="text-xs text-primary-light mt-2 italic">
                                        {s.reasoning}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Muscle Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-light" /> Muscle Usage Heatmap
                    </h2>
                    <MuscleHeatmap data={muscleData} />
                </div>

                {/* Volume Distribution */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">Volume Distribution</h2>
                    {muscleData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={muscleData.slice(0, 8)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="total_volume"
                                    nameKey="muscle"
                                >
                                    {muscleData.slice(0, 8).map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: '#2a2740',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        color: '#f1f5f9',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()} kg`, 'Volume']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-text-muted text-sm">
                            No data yet. Log workouts to see analytics.
                        </div>
                    )}
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {muscleData.slice(0, 8).map((d, i) => (
                            <div key={d.muscle} className="flex items-center gap-1.5 text-xs text-text-muted">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                                />
                                {d.muscle.replace('_', ' ')}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Volume Bar Chart + Workout Frequency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-secondary" /> Muscle Volume (Top 10)
                    </h2>
                    {muscleData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={muscleData.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis
                                    type="category"
                                    dataKey="muscle"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    width={80}
                                    tickFormatter={(v: string) => v.replace('_', ' ')}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#2a2740',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        color: '#f1f5f9',
                                        fontSize: '12px',
                                    }}
                                />
                                <Bar dataKey="total_volume" fill="#6366f1" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-text-muted text-sm">
                            No data yet.
                        </div>
                    )}
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-accent" /> Workout Frequency
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={frequencyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    background: '#2a2740',
                                    border: '1px solid #334155',
                                    borderRadius: '12px',
                                    color: '#f1f5f9',
                                    fontSize: '12px',
                                }}
                            />
                            <Bar dataKey="workouts" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PR Table */}
            {personalRecords.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-accent" /> Personal Records
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-text-muted border-b border-border">
                                    <th className="pb-3">Exercise</th>
                                    <th className="pb-3">Weight</th>
                                    <th className="pb-3">Reps</th>
                                    <th className="pb-3">Est. 1RM</th>
                                    <th className="pb-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personalRecords.map((pr) => (
                                    <tr key={pr.id} className="border-b border-border/50">
                                        <td className="py-3 font-medium">{pr.exercise_name}</td>
                                        <td className="py-3">{pr.weight_kg} kg</td>
                                        <td className="py-3">{pr.reps}</td>
                                        <td className="py-3 text-accent font-medium">
                                            {pr.estimated_1rm} kg
                                        </td>
                                        <td className="py-3 text-text-muted">
                                            {new Date(pr.achieved_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
