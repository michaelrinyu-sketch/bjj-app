import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { queryClient } from './lib/queryClient'

import { AuthGuard } from './components/guards/AuthGuard'
import { OnboardingGuard } from './components/guards/OnboardingGuard'
import { RootLayout } from './components/layout/RootLayout'

import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { CurriculumPage } from './pages/curriculum/CurriculumPage'
import { VideoLibraryPage } from './pages/videos/VideoLibraryPage'
import { TrainingLogPage } from './pages/training-log/TrainingLogPage'
import { TrainingSessionPage } from './pages/training-log/TrainingSessionPage'
import { TournamentPrepPage } from './pages/tournament/TournamentPrepPage'
import { InjuryTrackerPage } from './pages/injury/InjuryTrackerPage'
import { GoalSettingPage } from './pages/goals/GoalSettingPage'
import { SettingsPage } from './pages/SettingsPage'
import { PartnersPage } from './pages/partners/PartnersPage'
import { ConnectPage } from './pages/partners/ConnectPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected routes */}
            <Route element={<AuthGuard />}>
              {/* QR connect deep-link — no sidebar */}
              <Route path="/connect/:targetUserId" element={<ConnectPage />} />

              <Route element={<OnboardingGuard />}>
                <Route path="/onboarding" element={<OnboardingPage />} />

                <Route element={<RootLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/curriculum" element={<CurriculumPage />} />
                  <Route path="/videos" element={<VideoLibraryPage />} />
                  <Route path="/training-log" element={<TrainingLogPage />} />
                  <Route path="/training-log/new" element={<TrainingSessionPage />} />
                  <Route path="/training-log/:sessionId" element={<TrainingSessionPage />} />
                  <Route path="/tournament-prep" element={<TournamentPrepPage />} />
                  <Route path="/tournament-prep/:tournamentId" element={<TournamentPrepPage />} />
                  <Route path="/injuries" element={<InjuryTrackerPage />} />
                  <Route path="/goals" element={<GoalSettingPage />} />
                  <Route path="/partners" element={<PartnersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
