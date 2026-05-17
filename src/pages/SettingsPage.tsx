import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { GYM_SYSTEM_LABELS, BELT_LABELS, BELT_COLORS } from '../types/app'
import type { BeltLevel, GymSystem, PrimaryGoal } from '../types/app'
import { Check, Save, Trophy } from 'lucide-react'
import { Confetti } from '../components/Confetti'

const BELT_OPTIONS: { value: BeltLevel; label: string; color: string }[] = [
  { value: 'white', label: 'White', color: 'bg-gray-100 text-gray-900 border-gray-300' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-600 text-white border-blue-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-700 text-white border-purple-500' },
  { value: 'brown', label: 'Brown', color: 'bg-amber-800 text-white border-amber-700' },
  { value: 'black', label: 'Black', color: 'bg-neutral-900 text-white border-neutral-700' },
]

const BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black']

const GOAL_OPTIONS: { value: PrimaryGoal; label: string; description: string }[] = [
  { value: 'competition', label: 'Compete', description: 'Training for tournaments and competition' },
  { value: 'self_defense', label: 'Self-Defense', description: 'Practical techniques for real-world situations' },
  { value: 'fitness', label: 'Fitness', description: 'Staying fit and healthy through BJJ' },
  { value: 'recreation', label: 'Recreation', description: 'Enjoyment, community, and personal growth' },
]

const GYM_SYSTEM_OPTIONS: GymSystem[] = ['traditional', 'gracie_barra', 'gracie_combatives', 'tenth_planet', 'custom']

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [beltLevel, setBeltLevel] = useState<BeltLevel>('white')
  const [stripes, setStripes] = useState(0)
  const [gymSystem, setGymSystem] = useState<GymSystem>('traditional')
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>('recreation')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<{ type: 'belt' | 'stripe'; belt: BeltLevel; stripes: number } | null>(null)
  const [confettiActive, setConfettiActive] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setBeltLevel(profile.belt_level ?? 'white')
      setStripes(profile.stripes ?? 0)
      setGymSystem(profile.gym_system ?? 'traditional')
      setPrimaryGoal(profile.primary_goal ?? 'recreation')
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    setSaved(false)

    // Capture what we're about to save
    const prevBelt = profile?.belt_level ?? 'white'
    const prevStripes = profile?.stripes ?? 0

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        belt_level: beltLevel,
        stripes,
        gym_system: gymSystem,
        primary_goal: primaryGoal,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (error) {
      setError(error.message)
    } else {
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

      // Belt promotion or stripe earned?
      const beltPromoted = BELT_ORDER.indexOf(beltLevel) > BELT_ORDER.indexOf(prevBelt)
      const stripeEarned = beltLevel === prevBelt && stripes > prevStripes

      if (beltPromoted || stripeEarned) {
        setCelebration({
          type: beltPromoted ? 'belt' : 'stripe',
          belt: beltLevel,
          stripes,
        })
        setConfettiActive(true)
      }
    }
    setSaving(false)
  }

  return (
    <div className="max-w-lg space-y-8 animate-fade-in">
      <Confetti active={confettiActive} onDone={() => setConfettiActive(false)} />

      {/* Belt celebration overlay */}
      {celebration && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
          onClick={() => setCelebration(null)}
        >
          <div className="animate-scale-in text-center space-y-5 max-w-xs" onClick={e => e.stopPropagation()}>
            <Trophy size={48} className="text-accent mx-auto" />
            <div>
              <p className="text-gray-100 text-3xl font-black font-mono tracking-wider uppercase">
                {celebration.type === 'belt' ? 'Belt Promoted' : 'Stripe Earned'}
              </p>
              <p className="text-muted text-xs font-mono uppercase tracking-widest mt-2">
                {celebration.type === 'belt'
                  ? 'You earned it. The time on the mat paid off.'
                  : 'Another mark of progress. Keep showing up.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className={`px-4 py-2 text-sm font-black font-mono tracking-wider ${BELT_COLORS[celebration.belt]}`}>
                {BELT_LABELS[celebration.belt].toUpperCase()}
              </div>
              {celebration.stripes > 0 && (
                <div className="flex gap-1">
                  {Array.from({ length: celebration.stripes }).map((_, i) => (
                    <div key={i} className="w-2 h-6 bg-gray-100" />
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setCelebration(null)}
              className="btn-primary w-full justify-center"
            >
              OSS
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your profile and training preferences</p>
      </div>

      {/* Profile */}
      <section className="space-y-4">
        <p className="section-header">Profile</p>
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="input"
              placeholder="Your name"
              maxLength={40}
            />
          </div>
        </div>
      </section>

      {/* Belt */}
      <section className="space-y-4">
        <p className="section-header">Belt Rank</p>
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Belt</label>
            <div className="grid grid-cols-5 gap-2">
              {BELT_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setBeltLevel(value)}
                  className={`py-3 rounded border-2 text-xs font-semibold transition-all ${color} ${
                    beltLevel === value ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-2' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Stripes</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setStripes(n)}
                  className={`w-10 h-10 rounded border text-sm font-medium transition-colors ${
                    stripes === n
                      ? 'bg-accent border-accent text-white'
                      : 'bg-surface-3 border-border text-muted hover:text-gray-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gym System */}
      <section className="space-y-4">
        <p className="section-header">Gym System</p>
        <div className="card p-5">
          <div className="space-y-2">
            {GYM_SYSTEM_OPTIONS.map(value => (
              <button
                key={value}
                onClick={() => setGymSystem(value)}
                className={`w-full text-left px-4 py-3 rounded border transition-colors ${
                  gymSystem === value
                    ? 'bg-accent/10 border-accent text-gray-100'
                    : 'bg-surface-3 border-border text-gray-300 hover:border-border-strong'
                }`}
              >
                <span className="text-sm font-medium">{GYM_SYSTEM_LABELS[value]}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Primary Goal */}
      <section className="space-y-4">
        <p className="section-header">Primary Goal</p>
        <div className="card p-5">
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setPrimaryGoal(value)}
                className={`text-left px-4 py-3 rounded border transition-colors ${
                  primaryGoal === value
                    ? 'bg-accent/10 border-accent text-gray-100'
                    : 'bg-surface-3 border-border text-gray-300 hover:border-border-strong'
                }`}
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-muted mt-0.5">{description}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="px-3 py-2 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !displayName.trim()}
          className="btn-primary"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={14} />
              Save Changes
            </>
          )}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-400 text-sm animate-fade-in">
            <Check size={14} />
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
