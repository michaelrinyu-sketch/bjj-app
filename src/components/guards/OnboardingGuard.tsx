import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function OnboardingGuard() {
  const { profile, profileLoading } = useAuth()
  const location = useLocation()

  if (profileLoading) return null

  // If onboarding not complete, redirect to onboarding (unless already there)
  if (profile && !profile.onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // If onboarding complete and user tries to go to /onboarding, redirect to dashboard
  if (profile?.onboarding_complete && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
