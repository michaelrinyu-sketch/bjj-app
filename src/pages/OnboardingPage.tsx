import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { GYM_SYSTEM_LABELS } from '../types/app'
import type { BeltLevel, GymSystem } from '../types/app'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const BELT_OPTIONS: {
  value: BeltLevel
  label: string
  bg: string
  text: string
  border: string
}[] = [
  { value: 'white',  label: 'White',  bg: 'bg-gray-100',    text: 'text-gray-900', border: 'border-gray-300' },
  { value: 'blue',   label: 'Blue',   bg: 'bg-blue-600',    text: 'text-white',    border: 'border-blue-500' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-700',  text: 'text-white',    border: 'border-purple-500' },
  { value: 'brown',  label: 'Brown',  bg: 'bg-amber-800',   text: 'text-white',    border: 'border-amber-700' },
  { value: 'black',  label: 'Black',  bg: 'bg-neutral-900', text: 'text-white',    border: 'border-neutral-600' },
]

const GYM_OPTIONS: { value: GymSystem; label: string; description: string }[] = [
  { value: 'traditional',        label: 'Traditional / IBJJF',     description: 'Standard belt progression, structured curriculum' },
  { value: 'gracie_barra',       label: 'Gracie Barra',            description: 'GB1 / GB2 / GB3 structured program' },
  { value: 'gracie_combatives',  label: 'Gracie Combatives',       description: 'Ryron & Rener\'s 36-technique self-defense system' },
  { value: 'tenth_planet',       label: '10th Planet',             description: 'Eddie Bravo\'s no-gi: rubber guard, lockdown, twister' },
  { value: 'custom',             label: 'Custom / Independent',    description: 'Your gym runs its own curriculum — build it yourself' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i === current
              ? 'w-5 h-1.5 bg-accent'
              : i < current
              ? 'w-1.5 h-1.5 bg-accent/50'
              : 'w-1.5 h-1.5 bg-surface-4'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [displayName, setDisplayName] = useState('')
  // Step 2
  const [beltLevel, setBeltLevel] = useState<BeltLevel | ''>('')
  const [stripes, setStripes] = useState(0)
  // Step 3
  const [gymSystem, setGymSystem] = useState<GymSystem | ''>('')

  const TOTAL_STEPS = 3

  const canAdvance = () => {
    if (step === 0) return displayName.trim().length >= 2
    if (step === 1) return beltLevel !== ''
    if (step === 2) return gymSystem !== ''
    return false
  }

  const handleFinish = async () => {
    if (!user || !beltLevel || !gymSystem) return
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        display_name: displayName.trim(),
        belt_level: beltLevel,
        stripes,
        gym_system: gymSystem,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      await refreshProfile()
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-8 h-8 border border-accent flex items-center justify-center flex-none">
          <span className="text-accent font-black text-xs font-mono">▲</span>
        </div>
        <div>
          <p className="text-gray-100 font-black text-xs font-mono tracking-[0.3em] leading-none">TAP TRACKER</p>
          <p className="text-muted text-[9px] font-mono tracking-[0.2em] mt-0.5">BJJ COMPANION</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        <div className="bg-surface-1 border border-border rounded-sm overflow-hidden">
          {/* Progress bar */}
          <div className="h-0.5 bg-surface-4">
            <div
              className="h-0.5 bg-accent transition-all duration-500"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* Step content */}
          <div className="p-8">
            <div key={step} className="animate-fade-in">
              {step === 0 && <StepName value={displayName} onChange={setDisplayName} />}
              {step === 1 && (
                <StepBelt
                  beltLevel={beltLevel}
                  stripes={stripes}
                  onBelt={v => { setBeltLevel(v); setStripes(0) }}
                  onStripes={setStripes}
                />
              )}
              {step === 2 && <StepGym value={gymSystem} onChange={setGymSystem} />}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setStep(s => s - 1); setError(null) }}
                disabled={step === 0}
                className={`text-muted hover:text-gray-300 transition-colors flex items-center gap-1 text-sm ${
                  step === 0 ? 'invisible' : ''
                }`}
              >
                <ChevronLeft size={15} />
                Back
              </button>
            </div>

            <div className="flex items-center gap-5">
              <StepDots total={TOTAL_STEPS} current={step} />

              {step < TOTAL_STEPS - 1 ? (
                <button
                  onClick={() => { setStep(s => s + 1); setError(null) }}
                  disabled={!canAdvance()}
                  className="btn-primary"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={!canAdvance() || saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Let's go
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="px-8 pb-6 text-red-400 text-xs">{error}</p>
          )}
        </div>

        <p className="text-center text-muted text-xs mt-5">
          All of this can be changed later in Settings.
        </p>
      </div>
    </div>
  )
}

// ─── Step subcomponents ───────────────────────────────────────────────────────

function StepName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">Step 1 of 3</p>
        <h2 className="text-xl font-black text-gray-100 leading-snug">What do people call you on the mat?</h2>
        <p className="text-muted text-sm mt-2">This is your display name — nickname works fine.</p>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && value.trim().length >= 2 && (e.currentTarget.blur())}
        placeholder="e.g. Mike, Coach, Shark"
        className="input text-lg py-3"
        autoFocus
        maxLength={40}
      />
    </div>
  )
}

function StepBelt({
  beltLevel,
  stripes,
  onBelt,
  onStripes,
}: {
  beltLevel: BeltLevel | ''
  stripes: number
  onBelt: (v: BeltLevel) => void
  onStripes: (n: number) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">Step 2 of 3</p>
        <h2 className="text-xl font-black text-gray-100 leading-snug">What belt are you?</h2>
        <p className="text-muted text-sm mt-2">Sets your starting curriculum level.</p>
      </div>

      {/* Belt selector — large, tactile buttons */}
      <div className="grid grid-cols-5 gap-2">
        {BELT_OPTIONS.map(({ value, label, bg, text, border }) => (
          <button
            key={value}
            onClick={() => onBelt(value)}
            className={`relative flex flex-col items-center justify-center py-4 rounded border-2 transition-all ${bg} ${text} ${border} ${
              beltLevel === value
                ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-1 scale-105'
                : 'opacity-60 hover:opacity-90'
            }`}
          >
            <span className="text-xs font-bold font-mono">{label}</span>
            {beltLevel === value && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                <Check size={9} className="text-white" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stripe selector — appears when belt is chosen */}
      {beltLevel && (
        <div className="animate-fade-in">
          <p className="text-muted text-sm mb-3">
            {beltLevel === 'white' ? 'Stripes on your white belt?' : 'How many stripes?'}
          </p>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => onStripes(n)}
                className={`flex-1 h-10 rounded border text-sm font-bold font-mono transition-colors ${
                  stripes === n
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-3 border-border text-muted hover:text-gray-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {/* Visual stripe representation */}
          {stripes > 0 && (
            <div className="flex gap-1 mt-3">
              {Array.from({ length: stripes }).map((_, i) => (
                <div key={i} className="w-4 h-1.5 bg-gray-100 rounded-full" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepGym({ value, onChange }: { value: GymSystem | ''; onChange: (v: GymSystem) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">Step 3 of 3</p>
        <h2 className="text-xl font-black text-gray-100 leading-snug">What system does your gym run?</h2>
        <p className="text-muted text-sm mt-2">Loads the right technique curriculum for you.</p>
      </div>

      <div className="space-y-2">
        {GYM_OPTIONS.map(({ value: v, label, description }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`w-full text-left px-4 py-3 rounded border-2 transition-all ${
              value === v
                ? 'border-accent bg-accent/10 text-gray-100'
                : 'border-border bg-surface-3 text-gray-300 hover:border-border-strong'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{label}</span>
              {value === v && <Check size={14} className="text-accent flex-none" />}
            </div>
            <p className="text-xs text-muted mt-0.5">{description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
