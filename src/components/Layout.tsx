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
    User,
    LogOut,
    Flame,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/workout', icon: Dumbbell, label: 'Workout' },
    { to: '/routines', icon: ClipboardList, label: 'Routines' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/social', icon: Users, label: 'Social' },
    { to: '/health', icon: Heart, label: 'Health' },
    { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
    const { user, logout } = useAuthStore()
    const { activeWorkout } = useWorkoutStore()
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* ─── Sidebar (Desktop) ──────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent">
                            MuscleMap
                        </h1>
                        <p className="text-xs text-text-muted">Strength Tracker</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary/15 text-primary-light shadow-sm'
                                    : 'text-text-muted hover:bg-surface-light hover:text-text'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
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
                                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-danger text-white text-sm font-medium flex items-center gap-2 hover:brightness-110 transition"
                            >
                                <Flame className="w-4 h-4 animate-pulse" />
                                Workout in Progress
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* User */}
                <div className="border-t border-border px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                                {user?.display_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{user?.display_name}</p>
                                <p className="text-xs text-text-muted">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-surface-light transition"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ───────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-primary" />
                        <span className="font-bold text-primary-light">MuscleMap</span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-surface-light transition"
                    >
                        <div className="space-y-1.5">
                            <div className="w-5 h-0.5 bg-text-muted" />
                            <div className="w-5 h-0.5 bg-text-muted" />
                            <div className="w-3 h-0.5 bg-text-muted" />
                        </div>
                    </button>
                </header>

                {/* Mobile menu overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="md:hidden absolute top-14 left-0 right-0 z-50 bg-surface border-b border-border shadow-2xl"
                        >
                            <nav className="px-3 py-3 space-y-1">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                                                ? 'bg-primary/15 text-primary-light'
                                                : 'text-text-muted hover:bg-surface-light'
                                            }`
                                        }
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </NavLink>
                                ))}
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-surface-light transition"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Page content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
