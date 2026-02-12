import { useState, useEffect, useCallback } from 'react'
import {
    searchFoods,
    quickAddFoods,
    type FoodItem,
    type LoggedFood,
} from '../services/foodApi'
import {
    Search,
    Plus,
    X,
    Flame,
    Beef,
    Wheat,
    Droplets,
    Trash2,
    Apple,
    Coffee,
    Sun,
    Moon,
    Cookie,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const mealConfig: Record<MealType, { label: string; icon: typeof Coffee }> = {
    breakfast: { label: 'Breakfast', icon: Coffee },
    lunch: { label: 'Lunch', icon: Sun },
    dinner: { label: 'Dinner', icon: Moon },
    snack: { label: 'Snack', icon: Cookie },
}

const STORAGE_KEY = 'musclemap_food_log'
const GOALS_KEY = 'musclemap_macro_goals'

interface MacroGoals {
    calories: number
    protein: number
    carbs: number
    fat: number
}

const defaultGoals: MacroGoals = { calories: 2200, protein: 150, carbs: 250, fat: 70 }

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0]
}

function loadTodayLog(): LoggedFood[] {
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
        return all[getTodayKey()] || []
    } catch { return [] }
}

function saveTodayLog(items: LoggedFood[]) {
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
        all[getTodayKey()] = items
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    } catch { /* ignore */ }
}

function loadGoals(): MacroGoals {
    try {
        const g = JSON.parse(localStorage.getItem(GOALS_KEY) || 'null')
        return g || defaultGoals
    } catch { return defaultGoals }
}

function saveGoals(g: MacroGoals) {
    localStorage.setItem(GOALS_KEY, JSON.stringify(g))
}

export default function NutritionPage() {
    const [log, setLog] = useState<LoggedFood[]>(loadTodayLog)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<FoodItem[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
    const [grams, setGrams] = useState('100')
    const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch')
    const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null)
    const [goals, setGoals] = useState<MacroGoals>(loadGoals)
    const [showGoalEditor, setShowGoalEditor] = useState(false)
    const [showQuickAdd, setShowQuickAdd] = useState(true)

    // Save log whenever it changes
    useEffect(() => { saveTodayLog(log) }, [log])

    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([])
            return
        }
        const timer = setTimeout(async () => {
            setIsSearching(true)
            const results = await searchFoods(searchQuery)
            setSearchResults(results)
            setIsSearching(false)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Auto-detect current meal based on time
    useEffect(() => {
        const h = new Date().getHours()
        if (h < 10) setSelectedMeal('breakfast')
        else if (h < 14) setSelectedMeal('lunch')
        else if (h < 18) setSelectedMeal('snack')
        else setSelectedMeal('dinner')
    }, [])

    const addFood = useCallback((food: FoodItem) => {
        const g = parseFloat(grams) || 100
        const entry: LoggedFood = {
            id: crypto.randomUUID(),
            food,
            grams: g,
            meal: selectedMeal,
            timestamp: new Date().toISOString(),
        }
        setLog(prev => [...prev, entry])
        setSelectedFood(null)
        setGrams('100')
        setShowSearch(false)
        setSearchQuery('')
        setSearchResults([])
    }, [grams, selectedMeal])

    const removeFood = useCallback((id: string) => {
        setLog(prev => prev.filter(f => f.id !== id))
    }, [])

    const totals = log.reduce<MacroGoals>((acc, item) => {
        const mult = item.grams / 100
        acc.calories += item.food.calories * mult
        acc.protein += item.food.protein * mult
        acc.carbs += item.food.carbs * mult
        acc.fat += item.food.fat * mult
        return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

    const mealTotals = (meal: MealType) => {
        return log.filter(f => f.meal === meal).reduce<MacroGoals>((acc, item) => {
            const mult = item.grams / 100
            acc.calories += item.food.calories * mult
            acc.protein += item.food.protein * mult
            acc.carbs += item.food.carbs * mult
            acc.fat += item.food.fat * mult
            return acc
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    }

    const pct = (val: number, goal: number) => Math.min((val / goal) * 100, 100)

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                            <Apple className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Nutrition</h1>
                            <p className="text-text-muted text-sm">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSearch(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:brightness-110 transition shadow-lg shadow-green-500/20"
                    >
                        <Plus className="w-4 h-4" /> Add Food
                    </button>
                </div>
            </motion.div>

            {/* Macro Summary Rings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm">Daily Progress</h2>
                    <button onClick={() => setShowGoalEditor(!showGoalEditor)} className="text-xs text-text-muted hover:text-text transition">
                        {showGoalEditor ? 'Done' : 'Edit Goals'}
                    </button>
                </div>

                {showGoalEditor ? (
                    <div className="grid grid-cols-2 gap-3">
                        {([['calories', 'Calories', 'kcal'], ['protein', 'Protein', 'g'], ['carbs', 'Carbs', 'g'], ['fat', 'Fat', 'g']] as const).map(([key, label, unit]) => (
                            <div key={key}>
                                <label className="text-xs text-text-muted">{label} ({unit})</label>
                                <input
                                    type="number"
                                    value={goals[key]}
                                    onChange={e => {
                                        const v = { ...goals, [key]: parseInt(e.target.value) || 0 }
                                        setGoals(v)
                                        saveGoals(v)
                                    }}
                                    className="w-full mt-1 px-3 py-2 bg-surface-light border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'Calories', value: Math.round(totals.calories), goal: goals.calories, unit: 'kcal', icon: Flame, color: 'text-orange-400', bg: 'from-orange-500' },
                            { label: 'Protein', value: Math.round(totals.protein), goal: goals.protein, unit: 'g', icon: Beef, color: 'text-red-400', bg: 'from-red-500' },
                            { label: 'Carbs', value: Math.round(totals.carbs), goal: goals.carbs, unit: 'g', icon: Wheat, color: 'text-amber-400', bg: 'from-amber-500' },
                            { label: 'Fat', value: Math.round(totals.fat), goal: goals.fat, unit: 'g', icon: Droplets, color: 'text-blue-400', bg: 'from-blue-500' },
                        ].map((macro) => (
                            <div key={macro.label} className="text-center">
                                <div className="relative w-16 h-16 mx-auto mb-2">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-surface-light" strokeWidth="3" />
                                        <circle
                                            cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                                            className={macro.color}
                                            strokeDasharray={`${pct(macro.value, macro.goal) * 0.942} 94.2`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <macro.icon className={`w-4 h-4 ${macro.color}`} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold">{macro.value}</p>
                                <p className="text-[10px] text-text-muted">/ {macro.goal}{macro.unit}</p>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Meal Sections */}
            <div className="space-y-3">
                {(Object.keys(mealConfig) as MealType[]).map((meal) => {
                    const items = log.filter(f => f.meal === meal)
                    const mt = mealTotals(meal)
                    const Icon = mealConfig[meal].icon
                    const isExpanded = expandedMeal === meal || items.length > 0

                    return (
                        <motion.div
                            key={meal}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface border border-border rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedMeal(expandedMeal === meal ? null : meal)}
                                className="w-full flex items-center justify-between p-4 hover:bg-surface-light transition"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5 text-green-400" />
                                    <div className="text-left">
                                        <p className="font-medium text-sm">{mealConfig[meal].label}</p>
                                        <p className="text-xs text-text-muted">
                                            {items.length > 0 ? `${items.length} items • ${Math.round(mt.calories)} kcal` : 'No items yet'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedMeal(meal); setShowSearch(true) }}
                                        className="p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-green-400 transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {isExpanded && items.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                        className="border-t border-border overflow-hidden"
                                    >
                                        <div className="p-3 space-y-2">
                                            {items.map((item) => {
                                                const mult = item.grams / 100
                                                return (
                                                    <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-light group">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{item.food.name}</p>
                                                            <p className="text-xs text-text-muted">
                                                                {item.grams}g • {Math.round(item.food.calories * mult)} kcal •
                                                                P:{Math.round(item.food.protein * mult)}g
                                                                C:{Math.round(item.food.carbs * mult)}g
                                                                F:{Math.round(item.food.fat * mult)}g
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFood(item.id)}
                                                            className="p-1.5 rounded-lg text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>

            {/* Search/Add Modal */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
                        onClick={() => { setShowSearch(false); setSelectedFood(null); setSearchQuery(''); setSearchResults([]) }}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-bold text-lg">Add Food to {mealConfig[selectedMeal].label}</h2>
                                    <button onClick={() => { setShowSearch(false); setSelectedFood(null) }} className="p-1 rounded-lg hover:bg-surface-light transition">
                                        <X className="w-5 h-5 text-text-muted" />
                                    </button>
                                </div>
                                {!selectedFood && (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search foods (e.g., chicken breast, banana...)"
                                            className="w-full pl-10 pr-4 py-2.5 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Selected Food Detail */}
                            {selectedFood ? (
                                <div className="p-4 space-y-4">
                                    <div>
                                        <p className="font-semibold">{selectedFood.name}</p>
                                        {selectedFood.brand && <p className="text-xs text-text-muted">{selectedFood.brand}</p>}
                                    </div>
                                    <div className="grid grid-cols-4 gap-3 text-center text-xs">
                                        <div className="bg-surface-light rounded-lg p-2">
                                            <p className="font-bold text-orange-400">{Math.round(selectedFood.calories * (parseFloat(grams) || 100) / 100)}</p>
                                            <p className="text-text-muted">kcal</p>
                                        </div>
                                        <div className="bg-surface-light rounded-lg p-2">
                                            <p className="font-bold text-red-400">{Math.round(selectedFood.protein * (parseFloat(grams) || 100) / 100)}</p>
                                            <p className="text-text-muted">protein</p>
                                        </div>
                                        <div className="bg-surface-light rounded-lg p-2">
                                            <p className="font-bold text-amber-400">{Math.round(selectedFood.carbs * (parseFloat(grams) || 100) / 100)}</p>
                                            <p className="text-text-muted">carbs</p>
                                        </div>
                                        <div className="bg-surface-light rounded-lg p-2">
                                            <p className="font-bold text-blue-400">{Math.round(selectedFood.fat * (parseFloat(grams) || 100) / 100)}</p>
                                            <p className="text-text-muted">fat</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted">Portion (grams)</label>
                                        <input
                                            type="number" value={grams} onChange={(e) => setGrams(e.target.value)}
                                            className="w-full mt-1 px-4 py-2.5 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            {[50, 100, 150, 200, 250].map(g => (
                                                <button
                                                    key={g}
                                                    onClick={() => setGrams(String(g))}
                                                    className={`flex-1 py-1.5 text-xs rounded-lg border transition ${grams === String(g) ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'border-border text-text-muted hover:bg-surface-light'}`}
                                                >
                                                    {g}g
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSelectedFood(null)} className="flex-1 py-2.5 rounded-xl bg-surface-light border border-border text-sm hover:bg-surface-lighter transition">
                                            Back
                                        </button>
                                        <button
                                            onClick={() => addFood(selectedFood)}
                                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:brightness-110 transition"
                                        >
                                            Add to {mealConfig[selectedMeal].label}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto">
                                    {/* Loading */}
                                    {isSearching && (
                                        <div className="p-8 text-center">
                                            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                            <p className="text-sm text-text-muted mt-2">Searching...</p>
                                        </div>
                                    )}

                                    {/* API search results */}
                                    {!isSearching && searchResults.length > 0 && (
                                        <div className="p-2">
                                            <p className="px-3 py-2 text-xs text-text-muted font-semibold uppercase tracking-wide">Search Results</p>
                                            {searchResults.map(food => (
                                                <button
                                                    key={food.id}
                                                    onClick={() => setSelectedFood(food)}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-light transition text-left"
                                                >
                                                    {food.imageUrl ? (
                                                        <img src={food.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                            <Apple className="w-5 h-5 text-green-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{food.name}</p>
                                                        <p className="text-xs text-text-muted">
                                                            {food.brand && `${food.brand} • `}{food.calories} kcal • P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* No results */}
                                    {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                                        <div className="p-8 text-center">
                                            <p className="text-sm text-text-muted">No results found</p>
                                        </div>
                                    )}

                                    {/* Quick Add */}
                                    {searchQuery.length < 2 && (
                                        <div className="p-2">
                                            <button
                                                onClick={() => setShowQuickAdd(!showQuickAdd)}
                                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-text-muted font-semibold uppercase tracking-wide"
                                            >
                                                Quick Add (Common Foods)
                                                {showQuickAdd ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </button>
                                            {showQuickAdd && quickAddFoods.map(food => (
                                                <button
                                                    key={food.id}
                                                    onClick={() => setSelectedFood(food)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-light transition text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                        <Apple className="w-4 h-4 text-green-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{food.name}</p>
                                                        <p className="text-[11px] text-text-muted">{food.calories} kcal per {food.servingSize}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
