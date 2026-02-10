import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dumbbell, Mail, Lock, User, ArrowRight } from 'lucide-react'

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

    const inputClass = 'w-full pl-10 pr-4 py-3 bg-surface-light border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition placeholder:text-text-muted/50'

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Dumbbell className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent">
                        MuscleMap
                    </h1>
                    <p className="text-text-muted text-sm mt-1">AI-powered strength training</p>
                </div>

                {/* Card */}
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold mb-6">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 w-4 h-4 text-text-muted" />
                                    <input type="text" placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} required />
                                </div>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 w-4 h-4 text-text-muted" />
                                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} required />
                                </div>
                            </>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-text-muted" />
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-text-muted" />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required minLength={6} />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Sign Up' : 'Sign In'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-text-muted mt-6">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button onClick={() => { setIsSignUp(!isSignUp); clearError() }} className="text-primary-light font-medium hover:underline">
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
