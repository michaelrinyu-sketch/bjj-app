import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-800 rounded mb-4">
            <Mail size={20} className="text-green-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">Check your email</h2>
          <p className="text-muted text-sm">
            We sent a confirmation link to <span className="text-gray-300">{email}</span>.
            Click it to activate your account.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary mt-6"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded mb-4">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-100">Start your training log</h1>
          <p className="text-muted text-sm mt-1">$9.99 / year — cancel anytime</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input pl-9"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="input pl-9 pr-9"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-9"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
