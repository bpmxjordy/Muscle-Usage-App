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
// Positions on a 400×340 SVG. Front body centered at x≈100, Back body centered at x≈300.
const MUSCLE_POSITIONS: Record<MuscleGroup, { x: number; y: number; w: number; h: number; label: string }> = {
    // ── FRONT (centered at x≈100) ──
    neck: { x: 88, y: 38, w: 24, h: 14, label: 'Neck' },
    traps: { x: 78, y: 54, w: 44, h: 16, label: 'Traps' },
    front_delts: { x: 52, y: 72, w: 20, h: 20, label: 'F.Delt' },
    side_delts: { x: 128, y: 72, w: 20, h: 20, label: 'S.Delt' },
    chest: { x: 74, y: 76, w: 52, h: 28, label: 'Chest' },
    biceps: { x: 48, y: 100, w: 16, h: 34, label: 'Biceps' },
    triceps: { x: 136, y: 100, w: 16, h: 34, label: 'Triceps' },
    abs: { x: 82, y: 112, w: 36, h: 46, label: 'Abs' },
    obliques: { x: 72, y: 128, w: 10, h: 26, label: 'Obl' },
    forearms: { x: 42, y: 140, w: 14, h: 30, label: 'F.Arm' },
    quads: { x: 70, y: 184, w: 24, h: 54, label: 'Quads' },
    calves: { x: 73, y: 254, w: 18, h: 36, label: 'Calves' },
    // ── BACK (centered at x≈300) ──
    rear_delts: { x: 252, y: 72, w: 20, h: 20, label: 'R.Delt' },
    upper_back: { x: 276, y: 76, w: 48, h: 24, label: 'Up.Back' },
    lats: { x: 272, y: 102, w: 56, h: 34, label: 'Lats' },
    lower_back: { x: 282, y: 140, w: 36, h: 22, label: 'Lo.Back' },
    glutes: { x: 278, y: 172, w: 44, h: 24, label: 'Glutes' },
    hamstrings: { x: 272, y: 204, w: 22, h: 46, label: 'Hams' },
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

                {/* ─── FRONT BODY SILHOUETTE ─── */}
                <ellipse cx="100" cy="30" rx="16" ry="14" fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M68,55 Q62,55 60,68 L58,92 Q56,110 62,125 L66,165 Q68,175 76,178 L124,178 Q132,175 134,165 L138,125 Q144,110 142,92 L140,68 Q138,55 132,55 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M60,68 Q48,66 44,78 L38,140 Q36,158 40,176 L44,176 Q50,158 48,140 L54,92 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M140,68 Q152,66 156,78 L162,140 Q164,158 160,176 L156,176 Q150,158 152,140 L146,92 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M76,178 Q72,180 68,190 L62,252 Q60,272 64,298 L86,298 Q88,272 86,252 L92,190 Q96,180 100,178 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M100,178 Q104,180 108,190 L114,252 Q116,272 112,298 L136,298 Q138,272 140,252 L134,190 Q130,180 124,178 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />

                {/* ─── BACK BODY SILHOUETTE ─── */}
                <ellipse cx="300" cy="30" rx="16" ry="14" fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M268,55 Q262,55 260,68 L258,92 Q256,110 262,125 L266,165 Q268,175 276,178 L324,178 Q332,175 334,165 L338,125 Q344,110 342,92 L340,68 Q338,55 332,55 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M260,68 Q248,66 244,78 L238,140 Q236,158 240,176 L244,176 Q250,158 248,140 L254,92 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M340,68 Q352,66 356,78 L362,140 Q364,158 360,176 L356,176 Q350,158 352,140 L346,92 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M276,178 Q272,180 268,190 L262,252 Q260,272 264,298 L286,298 Q288,272 286,252 L292,190 Q296,180 300,178 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />
                <path d="M300,178 Q304,180 308,190 L314,252 Q316,272 312,298 L336,298 Q338,272 340,252 L334,190 Q330,180 324,178 Z"
                    fill="#1e1b2e" stroke="#334155" strokeWidth="1" />

                {/* Muscle groups overlay */}
                {(Object.entries(MUSCLE_POSITIONS) as [MuscleGroup, typeof MUSCLE_POSITIONS[MuscleGroup]][]).map(
                    ([muscle, pos]) => {
                        const muscleData = dataMap[muscle]
                        const intensity = muscleData?.intensity || 0
                        const isHovered = hoveredMuscle === muscle

                        return (
                            <g key={muscle}>
                                <rect
                                    x={pos.x}
                                    y={pos.y}
                                    width={pos.w}
                                    height={pos.h}
                                    rx={6}
                                    fill={getHeatColor(intensity)}
                                    stroke={isHovered ? '#f1f5f9' : intensity > 0 ? getHeatColor(intensity) : '#334155'}
                                    strokeWidth={isHovered ? 2 : 1}
                                    opacity={isHovered ? 1 : 0.85}
                                    className="cursor-pointer transition-all duration-200"
                                    onMouseEnter={() => setHoveredMuscle(muscle)}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                />
                                <text
                                    x={pos.x + pos.w / 2}
                                    y={pos.y + pos.h / 2 + 3}
                                    textAnchor="middle"
                                    className="fill-text pointer-events-none"
                                    fontSize={8}
                                    fontWeight={500}
                                >
                                    {pos.label}
                                </text>
                            </g>
                        )
                    }
                )}
            </svg>

            {/* Hover tooltip */}
            {hoveredMuscle && dataMap[hoveredMuscle] && (
                <div className="absolute top-4 right-4 bg-surface-light border border-border rounded-xl p-3 shadow-xl text-sm">
                    <p className="font-bold">{MUSCLE_POSITIONS[hoveredMuscle].label}</p>
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
