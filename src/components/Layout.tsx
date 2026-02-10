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

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* ─── Sidebar (Desktop) ──────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-64 glass border-r-0 relative z-10 mx-3 my-3 rounded-2xl h-[calc(100vh-24px)] shadow-2xl shadow-black/20">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-border/10">
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
                                    ? 'bg-primary/20 text-primary-light shadow-sm backdrop-blur-sm'
                                    : 'text-text-muted hover:bg-white/5 hover:text-text'
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
                                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-danger text-white text-sm font-medium flex items-center gap-2 hover:brightness-110 transition shadow-lg shadow-danger/20"
                            >
                                <Flame className="w-4 h-4 animate-pulse" />
                                Workout in Progress
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* User */}
                <div className="border-t border-border/10 px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                {user?.display_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/90">{user?.display_name}</p>
                                <p className="text-xs text-text-muted">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-white/5 transition"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ───────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden relative z-0">
                {/* Background Blobs for specific pages could go here if needed, 
                    but we have them on body now. */}

                {/* Page content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 scroll-smooth">
                    <Outlet />
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t-0 z-50 safe-area-pb rounded-t-2xl">
                    <div className="grid grid-cols-7 h-16">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive
                                        ? 'text-primary-light scale-110 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                                        : 'text-text-muted hover:text-text'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 mb-1" />
                                <span className="text-[9px] font-medium leading-none truncate w-full text-center px-0.5">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>
            </main>
        </div>
    )
}
