import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import {
    Heart,
    Flame,
    Droplets,
    Apple,
    Calculator,
    TrendingUp,
    Info,
    Loader2,
    Check,
    CalendarDays,
} from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts'
import { motion } from 'framer-motion'
import {
    getNutritionLog,
    upsertNutrition,
    getNutritionHistory,
} from '../services/health.service'
import type { DailyNutrition } from '../types'

// ─── Calculators ────────────────────────────────────────────────────
function calculateBMR(w: number, h: number, a: number, g: string) {
    const base = 10 * w + 6.25 * h - 5 * a
    return g === 'female' ? base - 161 : base + 5
}
function calculateTDEE(bmr: number, level: string) {
    const m: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
    return Math.round(bmr * (m[level] || 1.55))
}
function calculateBMI(w: number, h: number) {
    return Math.round((w / ((h / 100) ** 2)) * 10) / 10
}
function getBMICategory(bmi: number) {
    if (bmi < 18.5) return { label: 'Underweight', color: '#06b6d4' }
    if (bmi < 25) return { label: 'Normal', color: '#10b981' }
    if (bmi < 30) return { label: 'Overweight', color: '#f59e0b' }
    return { label: 'Obese', color: '#ef4444' }
}

function todayStr() {
    return new Date().toISOString().split('T')[0]
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981']

export default function HealthPage() {
    const { user, updateProfile } = useAuthStore()
    const userId = user?.id || ''

    // ─── Body metrics state ─────────────────────────────────────────
    const [weight, setWeight] = useState(user?.weight_kg?.toString() || '75')
    const [height, setHeight] = useState(user?.height_cm?.toString() || '175')
    const [age, setAge] = useState(user?.age?.toString() || '25')
    const [gender, setGender] = useState(user?.gender || 'male')
    const [activityLevel, setActivityLevel] = useState(user?.activity_level || 'moderate')

    // ─── Daily log state ────────────────────────────────────────────
    const [dailyCal, setDailyCal] = useState('')
    const [dailyP, setDailyP] = useState('')
    const [dailyC, setDailyC] = useState('')
    const [dailyF, setDailyF] = useState('')
    const [dailyW, setDailyW] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loadingToday, setLoadingToday] = useState(true)

    // ─── History state ──────────────────────────────────────────────
    const [history, setHistory] = useState<DailyNutrition[]>([])
    const [loadingHistory, setLoadingHistory] = useState(true)

    // ─── Calculations ───────────────────────────────────────────────
    const m = useMemo(() => {
        const w = parseFloat(weight) || 75
        const h = parseFloat(height) || 175
        const a = parseInt(age) || 25
        const bmi = calculateBMI(w, h)
        const bmr = Math.round(calculateBMR(w, h, a, gender))
        const tdee = calculateTDEE(bmr, activityLevel)
        const protein = Math.round(w * 2)
        const fat = Math.round((tdee * 0.25) / 9)
        const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4)
        return { bmi, bmr, tdee, protein, carbs, fat }
    }, [weight, height, age, gender, activityLevel])

    const bmiCat = getBMICategory(m.bmi)
    const macros = [
        { name: 'Protein', value: m.protein * 4, grams: m.protein },
        { name: 'Carbs', value: m.carbs * 4, grams: m.carbs },
        { name: 'Fat', value: m.fat * 9, grams: m.fat },
    ]

    // ─── Load today's log ───────────────────────────────────────────
    const loadToday = useCallback(async () => {
        if (!userId) return
        setLoadingToday(true)
        try {
            const log = await getNutritionLog(userId, todayStr())
            if (log) {
                setDailyCal(log.calories?.toString() || '')
                setDailyP(log.protein_g?.toString() || '')
                setDailyC(log.carbs_g?.toString() || '')
                setDailyF(log.fat_g?.toString() || '')
                setDailyW(log.water_ml?.toString() || '')
            }
        } catch {
            // silently fail
        } finally {
            setLoadingToday(false)
        }
    }, [userId])

    // ─── Load history ───────────────────────────────────────────────
    const loadHistory = useCallback(async () => {
        if (!userId) return
        setLoadingHistory(true)
        try {
            const data = await getNutritionHistory(userId, 14)
            setHistory(data)
        } catch {
            // silently fail
        } finally {
            setLoadingHistory(false)
        }
    }, [userId])

    useEffect(() => {
        loadToday()
        loadHistory()
    }, [loadToday, loadHistory])

    // ─── Save daily log ─────────────────────────────────────────────
    const handleLogIntake = async () => {
        if (!userId) return
        setSaving(true)
        setSaved(false)
        try {
            await upsertNutrition(userId, todayStr(), {
                calories: parseInt(dailyCal) || 0,
                protein_g: parseInt(dailyP) || 0,
                carbs_g: parseInt(dailyC) || 0,
                fat_g: parseInt(dailyF) || 0,
                water_ml: parseInt(dailyW) || 0,
            })
            setSaved(true)
            await loadHistory()
            setTimeout(() => setSaved(false), 2000)
        } catch {
            // silently fail
        } finally {
            setSaving(false)
        }
    }

    // ─── Format history for chart ───────────────────────────────────
    const chartData = useMemo(() => {
        return [...history]
            .reverse()
            .map((d) => ({
                date: new Date(d.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
                calories: d.calories,
                protein: d.protein_g,
            }))
    }, [history])

    const inputClass =
        'w-full px-3 py-2.5 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition'

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Health & Nutrition</h1>
                <p className="text-text-muted">
                    Track calories, macros, and get personalized recommendations
                </p>
            </div>

            {/* Body Metrics */}
            <div className="bg-surface border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary-light" /> Your Body Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Weight (kg)</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Height (cm)</label>
                        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Age</label>
                        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Gender</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Activity</label>
                        <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className={inputClass}>
                            <option value="sedentary">Sedentary</option>
                            <option value="light">Light</option>
                            <option value="moderate">Moderate</option>
                            <option value="active">Active</option>
                            <option value="very_active">Very Active</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={() =>
                        updateProfile({
                            weight_kg: parseFloat(weight),
                            height_cm: parseFloat(height),
                            age: parseInt(age),
                            gender: gender as any,
                            activity_level: activityLevel as any,
                        })
                    }
                    className="mt-4 px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:brightness-110 transition"
                >
                    Save Profile
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Heart, label: 'BMI', value: m.bmi, sub: bmiCat.label, color: bmiCat.color, bg: 'bg-primary/10' },
                    { icon: Flame, label: 'BMR (kcal/day)', value: m.bmr, sub: 'Basal metabolic rate', bg: 'bg-accent/10' },
                    { icon: TrendingUp, label: 'TDEE (kcal/day)', value: m.tdee, sub: 'Maintenance calories', bg: 'bg-success/10' },
                    { icon: Apple, label: 'Protein Target', value: `${m.protein}g`, sub: '~2g per kg bodyweight', bg: 'bg-secondary/10' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-surface border border-border rounded-2xl p-5"
                    >
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                            <s.icon className="w-5 h-5 text-primary-light" />
                        </div>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-sm text-text-muted">{s.label}</p>
                        {s.color ? (
                            <span
                                className="text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full"
                                style={{ background: `${s.color}20`, color: s.color }}
                            >
                                {s.sub}
                            </span>
                        ) : (
                            <p className="text-xs text-text-muted mt-1">{s.sub}</p>
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Macros Chart */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">Recommended Daily Macros</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={macros} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                {macros.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i]} />
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
                                formatter={(v: number, n: string) => [`${Math.round(v)} kcal`, n]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-2">
                        {macros.map((d, i) => (
                            <div key={d.name} className="text-center">
                                <div className="flex items-center gap-1.5 justify-center">
                                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                                    <span className="text-xs text-text-muted">{d.name}</span>
                                </div>
                                <p className="text-sm font-bold mt-0.5">{d.grams}g</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Log */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Apple className="w-5 h-5 text-success" /> Log Today's Intake
                    </h2>
                    {loadingToday ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Calories (kcal)</label>
                                <input
                                    type="number"
                                    value={dailyCal}
                                    onChange={(e) => setDailyCal(e.target.value)}
                                    placeholder={`Target: ${m.tdee}`}
                                    className={inputClass}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Protein (g)</label>
                                    <input type="number" value={dailyP} onChange={(e) => setDailyP(e.target.value)} placeholder={`${m.protein}`} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Carbs (g)</label>
                                    <input type="number" value={dailyC} onChange={(e) => setDailyC(e.target.value)} placeholder={`${m.carbs}`} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Fat (g)</label>
                                    <input type="number" value={dailyF} onChange={(e) => setDailyF(e.target.value)} placeholder={`${m.fat}`} className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block flex items-center gap-1">
                                    <Droplets className="w-3 h-3" /> Water (ml)
                                </label>
                                <input type="number" value={dailyW} onChange={(e) => setDailyW(e.target.value)} placeholder="2500" className={inputClass} />
                            </div>
                            <button
                                onClick={handleLogIntake}
                                disabled={saving}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-success to-success text-white font-medium text-sm hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : saved ? (
                                    <><Check className="w-4 h-4" /> Saved!</>
                                ) : (
                                    'Log Intake'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Nutrition History Chart */}
            <div className="bg-surface border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-accent" /> Nutrition History (Last 14 Days)
                </h2>
                {loadingHistory ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-text-muted text-sm">
                        No nutrition data yet. Log your daily intake above to see trends.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    background: '#2a2740',
                                    border: '1px solid #334155',
                                    borderRadius: '12px',
                                    color: '#f1f5f9',
                                    fontSize: '12px',
                                }}
                            />
                            <Bar dataKey="calories" fill="#6366f1" radius={[4, 4, 0, 0]} name="Calories (kcal)" />
                            <Bar dataKey="protein" fill="#10b981" radius={[4, 4, 0, 0]} name="Protein (g)" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
                {!loadingHistory && chartData.length > 0 && (
                    <div className="flex justify-center gap-6 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <div className="w-3 h-3 rounded-full" style={{ background: '#6366f1' }} />
                            Calories
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
                            Protein
                        </div>
                    </div>
                )}
            </div>

            {/* Info box */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary-light flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-muted">
                    <p className="font-medium text-text mb-1">How are these calculated?</p>
                    <p>
                        <strong>BMR</strong> uses the Mifflin-St Jeor equation. <strong>TDEE</strong> multiplies BMR
                        by an activity factor. <strong>Protein</strong> recommendation is ~2g per kg bodyweight, ideal
                        for strength athletes.
                    </p>
                </div>
            </div>
        </div>
    )
}
