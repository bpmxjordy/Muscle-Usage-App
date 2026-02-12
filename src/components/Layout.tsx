import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWorkoutStore } from '../stores/workoutStore'
import {
    Dumbbell,
    LayoutDashboard,
    ClipboardList,
    BarChart3,
    Users,
    Heart,
    Apple,
    User,
    LogOut,
    Flame,
    Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'


const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/workout', icon: Dumbbell, label: 'Workout' },
    { to: '/ai-trainer', icon: Sparkles, label: 'AI Trainer' },
    { to: '/routines', icon: ClipboardList, label: 'Routines' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/social', icon: Users, label: 'Social' },
    { to: '/nutrition', icon: Apple, label: 'Nutrition' },
    { to: '/health', icon: Heart, label: 'Health' },
    { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
    const { user, logout } = useAuthStore()
    const { activeWorkout } = useWorkoutStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* ─── Sidebar (Desktop) ──────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-64 relative z-10 mx-3 my-3 rounded-2xl h-[calc(100vh-24px)] overflow-hidden">
                {/* Gradient border wrapper */}
                <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-b from-primary/20 via-border/30 to-secondary/20 pointer-events-none" />
                <div className="relative flex flex-col h-full rounded-2xl bg-surface/80 backdrop-blur-xl shadow-2xl shadow-black/30">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Dumbbell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold shimmer-text">
                                MuscleMap
                            </h1>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest">Strength Tracker</p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-4 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${isActive
                                        ? 'bg-primary/15 text-primary-light'
                                        : 'text-text-muted hover:bg-white/5 hover:text-text'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-primary to-secondary"
                                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            />
                                        )}
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Active workout indicator */}
                    <AnimatePresence>
                        {activeWorkout && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mx-3 mb-3"
                            >
                                <button
                                    onClick={() => navigate('/workout')}
                                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-danger text-white text-sm font-medium flex items-center gap-2 hover:brightness-110 transition shadow-lg shadow-danger/20 pulse-ring"
                                >
                                    <Flame className="w-4 h-4 animate-pulse" />
                                    Workout in Progress
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Divider */}
                    <div className="mx-4 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />

                    {/* User */}
                    <div className="px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/15 flex-shrink-0">
                                    {user?.display_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white/90 truncate">{user?.display_name}</p>
                                    <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition flex-shrink-0"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ───────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden relative z-0">
                {/* Page content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 scroll-smooth">
                    <Outlet />
                </div>

                {/* Mobile Bottom Nav — only the 5 most important items */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
                    <div className="mx-2 mb-2 rounded-2xl bg-surface/90 backdrop-blur-xl border border-border/30 shadow-2xl shadow-black/40">
                        <div className="grid grid-cols-5 h-16">
                            {navItems.filter(item => ['/', '/workout', '/ai-trainer', '/nutrition', '/profile'].includes(item.to)).map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${isActive
                                            ? 'text-primary-light'
                                            : 'text-text-muted hover:text-text'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="mobile-nav-active"
                                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-primary to-secondary"
                                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                                />
                                            )}
                                            <item.icon className={`w-5 h-5 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
                                            <span className="text-[9px] font-medium leading-none truncate w-full text-center px-0.5">{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </nav>
            </main>
        </div>
    )
}
