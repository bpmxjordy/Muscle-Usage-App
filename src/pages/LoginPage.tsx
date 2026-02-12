import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dumbbell, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react'

export default function LoginPage() {
    const { login, signup, error, clearError, isLoading } = useAuthStore()
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()
        try {
            if (isSignUp) {
                await signup(email, password, username || email.split('@')[0], displayName || username)
            } else {
                await login(email, password)
            }
            navigate('/')
        } catch {
            // error is set in the store
        }
    }

    const inputClass = 'w-full pl-11 pr-4 py-3.5 bg-surface-light/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all placeholder:text-text-muted/40'

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }}
                    animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    initial={{ top: '10%', left: '10%' }}
                />
                <motion.div
                    className="absolute w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)' }}
                    animate={{ x: [0, -25, 15, 0], y: [0, 25, -15, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    initial={{ bottom: '15%', right: '10%' }}
                />
                <motion.div
                    className="absolute w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%)' }}
                    animate={{ x: [0, 20, -30, 0], y: [0, -30, 10, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                    initial={{ top: '50%', right: '30%' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                        className="relative inline-block"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-secondary mx-auto flex items-center justify-center shadow-2xl shadow-primary/30 glow-primary">
                            <Dumbbell className="w-10 h-10 text-white" />
                        </div>
                        <motion.div
                            className="absolute -top-1 -right-1"
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Sparkles className="w-5 h-5 text-accent" />
                        </motion.div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-extrabold mt-5 shimmer-text"
                    >
                        MuscleMap
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-text-muted text-sm mt-2"
                    >
                        AI-powered strength training
                    </motion.p>
                </div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="gradient-border"
                >
                    <div className="bg-surface/90 backdrop-blur-2xl rounded-2xl p-8">
                        <h2 className="text-xl font-bold mb-1">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                        <p className="text-text-muted text-sm mb-6">
                            {isSignUp ? 'Start your fitness journey today' : 'Continue your training'}
                        </p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {isSignUp && (
                                <>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted/60">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input type="text" placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} required />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted/60">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} required />
                                    </div>
                                </>
                            )}

                            <div className="relative">
                                <div className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted/60">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                            </div>

                            <div className="relative">
                                <div className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted/60">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required minLength={6} />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 mt-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isSignUp ? 'Create Account' : 'Sign In'}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/30"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-surface text-text-muted/60">or</span>
                            </div>
                        </div>

                        <p className="text-center text-sm text-text-muted">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button onClick={() => { setIsSignUp(!isSignUp); clearError() }} className="text-primary-light font-semibold hover:underline transition">
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
