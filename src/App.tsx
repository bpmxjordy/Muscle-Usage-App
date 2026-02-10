import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useWorkoutStore } from './stores/workoutStore'
import { useEffect } from 'react'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import WorkoutPage from './pages/WorkoutPage'
import RoutinesPage from './pages/RoutinesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SocialPage from './pages/SocialPage'
import HealthPage from './pages/HealthPage'
import ProfilePage from './pages/ProfilePage'
import './index.css'

function AppInit({ children }: { children: React.ReactNode }) {
  const { initialize, isAuthenticated, user, isLoading } = useAuthStore()
  const { loadUserData } = useWorkoutStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserData(user.id)
    }
  }, [isAuthenticated, user?.id, loadUserData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Loading MuscleMap...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="workout" element={<WorkoutPage />} />
            <Route path="routines" element={<RoutinesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="social" element={<SocialPage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInit>
    </BrowserRouter>
  )
}
