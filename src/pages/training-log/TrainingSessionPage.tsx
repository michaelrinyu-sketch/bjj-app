import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import type { SessionType } from '../../types/app'
import { ArrowLeft, Plus, X, Trash2, Minus, Users, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'open_mat', label: 'Open Mat' },
  { value: 'drilling', label: 'Drilling' },
  { value: 'competition', label: 'Competition' },
]

function PartnerTag({ userId, onRemove }: { userId: string; onRemove: () => void }) {
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    supabase.from('profiles').select('display_name').eq('id', userId).single().then(({ data }) => {
      if (data) setName(data.display_name)
    })
  }, [userId])
  return (
    <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-3 border border-border text-xs text-gray-300 font-mono">
      {name ?? userId.slice(0, 8)}
      <button type="button" onClick={onRemove} className="text-muted hover:text-red-400">
        <X size={11} />
      </button>
    </span>
  )
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="label">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded bg-surface-3 border border-border text-muted hover:text-gray-300 flex items-center justify-center transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-8 text-center font-mono text-sm text-gray-200">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded bg-surface-3 border border-border text-muted hover:text-gray-300 flex items-center justify-center transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}

export function TrainingSessionPage() {
  const { sessionId } = useParams()
  const isNew = !sessionId || sessionId === 'new'
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [logged, setLogged] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Core session fields
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState(60)
  const [sessionType, setSessionType] = useState<SessionType>('gi')
  const [rounds, setRounds] = useState(0)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [techniques, setTechniques] = useState<string[]>([])
  const [techniqueInput, setTechniqueInput] = useState('')
  const [notes, setNotes] = useState('')

  // Intention / reflection
  const [gamePlan, setGamePlan] = useState('')
  const [reflection, setReflection] = useState('')

  // Training partners
  const [trainingPartners, setTrainingPartners] = useState<string[]>([])
  const [partnerInput, setPartnerInput] = useState('')
  const [partnerSuggestions, setPartnerSuggestions] = useState<{ id: string; display_name: string | null }[]>([])

  // Combat stats
  const [subsLanded, setSubsLanded] = useState(0)
  const [subsCaught, setSubsCaught] = useState(0)
  const [sweeps, setSweeps] = useState(0)
  const [takedowns, setTakedowns] = useState(0)
  const [dominantPositions, setDominantPositions] = useState(0)

  useEffect(() => {
    if (!isNew && sessionId && user) {
      supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSessionDate(data.session_date)
            setDuration(data.duration_minutes)
            setSessionType(data.session_type)
            setRounds(data.sparring_rounds ?? 0)
            setNotes(data.notes ?? '')
            setEnergyLevel(data.energy_level ?? 3)
            setTechniques(data.techniques_drilled ?? [])
            setGamePlan(data.game_plan ?? '')
            setReflection(data.reflection ?? '')
            setTrainingPartners(data.training_partners ?? [])
            setSubsLanded(data.submissions_landed ?? 0)
            setSubsCaught(data.submissions_caught ?? 0)
            setSweeps(data.sweeps ?? 0)
            setTakedowns(data.takedowns ?? 0)
            setDominantPositions(data.dominant_positions ?? 0)
          }
          setLoading(false)
        })
    }
  }, [sessionId, isNew, user])

  const addTechnique = () => {
    const t = techniqueInput.trim()
    if (t && !techniques.includes(t)) {
      setTechniques([...techniques, t])
      setTechniqueInput('')
    }
  }

  const searchPartners = async (q: string) => {
    setPartnerInput(q)
    if (q.trim().length < 2) { setPartnerSuggestions([]); return }
    const { data } = await supabase
      .from('partner_connections')
      .select('partner_id, profiles!partner_connections_partner_id_fkey(display_name)')
      .eq('user_id', user!.id)
    if (!data) return
    const matches = data
      .map((r: any) => ({ id: r.partner_id, display_name: r.profiles?.display_name }))
      .filter((p: { id: string; display_name: string | null }) =>
        (p.display_name ?? '').toLowerCase().includes(q.toLowerCase()) &&
        !trainingPartners.includes(p.id)
      )
    setPartnerSuggestions(matches)
  }

  const addPartner = (id: string) => {
    if (!trainingPartners.includes(id)) setTrainingPartners([...trainingPartners, id])
    setPartnerInput('')
    setPartnerSuggestions([])
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    const payload = {
      user_id: user.id,
      session_date: sessionDate,
      duration_minutes: duration,
      session_type: sessionType,
      sparring_rounds: rounds,
      notes: notes.trim(),
      energy_level: energyLevel,
      techniques_drilled: techniques,
      game_plan: gamePlan.trim(),
      reflection: reflection.trim(),
      training_partners: trainingPartners,
      submissions_landed: subsLanded,
      submissions_caught: subsCaught,
      sweeps,
      takedowns,
      dominant_positions: dominantPositions,
    }

    let err
    if (isNew) {
      ;({ error: err } = await supabase.from('training_sessions').insert(payload))
    } else {
      ;({ error: err } = await supabase.from('training_sessions').update(payload).eq('id', sessionId).eq('user_id', user.id))
    }

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      setLogged(true)
      setTimeout(() => navigate('/training-log'), 900)
    }
  }

  const handleDelete = async () => {
    if (!user || isNew) return
    setDeleting(true)
    await supabase.from('training_sessions').delete().eq('id', sessionId).eq('user_id', user.id)
    queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
    navigate('/training-log')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost px-2">
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title">
          {isNew ? 'Record Session' : 'Edit Record'}
        </h1>
        {!isNew && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Game Plan — pre-session intent */}
        <div>
          <label className="label">Game Plan</label>
          <p className="text-xs text-muted mb-1.5">What 1–2 things are you specifically working on today?</p>
          <textarea
            value={gamePlan}
            onChange={e => setGamePlan(e.target.value)}
            className="input resize-none"
            rows={2}
            placeholder="e.g. Stay tight in top half guard, bait the underhook sweep..."
          />
        </div>

        {/* Date & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Type</label>
            <select value={sessionType} onChange={e => setSessionType(e.target.value as SessionType)} className="input">
              {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Duration & Rounds */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              min={1}
              max={480}
              className="input"
            />
          </div>
          <div>
            <label className="label">Sparring Rounds</label>
            <input
              type="number"
              value={rounds}
              onChange={e => setRounds(Number(e.target.value))}
              min={0}
              max={50}
              className="input"
            />
          </div>
        </div>

        {/* Energy level */}
        <div>
          <label className="label">Energy Level</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setEnergyLevel(n)}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  n <= energyLevel ? 'bg-accent text-white' : 'bg-surface-3 border border-border text-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider mt-1">
            {energyLevel === 1 && 'Gassed — survival mode'}
            {energyLevel === 2 && 'Low — limited output'}
            {energyLevel === 3 && 'Moderate — steady'}
            {energyLevel === 4 && 'High — sharp and responsive'}
            {energyLevel === 5 && 'Peak — full output'}
          </p>
        </div>

        {/* Techniques drilled */}
        <div>
          <label className="label">Techniques Drilled</label>
          <div className="flex gap-2 mb-2">
            <input
              value={techniqueInput}
              onChange={e => setTechniqueInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTechnique())}
              placeholder="e.g. arm bar from closed guard, hip escape"
              className="input"
            />
            <button type="button" onClick={addTechnique} className="btn-secondary flex-none">
              <Plus size={14} />
            </button>
          </div>
          {techniques.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {techniques.map(t => (
                <span key={t} className="flex items-center gap-1.5 px-2 py-1 bg-surface-3 border border-border text-xs text-gray-300 font-mono">
                  {t}
                  <button type="button" onClick={() => setTechniques(techniques.filter(x => x !== t))} className="text-muted hover:text-red-400">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Training partners */}
        <div>
          <label className="label">Training Partners</label>
          <p className="text-xs text-muted mb-1.5">Tag connected partners you rolled with today.</p>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={partnerInput}
                  onChange={e => searchPartners(e.target.value)}
                  placeholder="Search connected partners..."
                  className="input pl-8"
                />
              </div>
            </div>
            {partnerSuggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-surface-2 border border-border rounded shadow-lg">
                {partnerSuggestions.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addPartner(p.id)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-surface-3 transition-colors"
                  >
                    {p.display_name ?? 'Unnamed'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {trainingPartners.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {trainingPartners.map(id => (
                <PartnerTag
                  key={id}
                  userId={id}
                  onRemove={() => setTrainingPartners(trainingPartners.filter(x => x !== id))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Combat stats */}
        <div>
          <label className="label">Combat Stats</label>
          <div className="card p-4 grid grid-cols-2 gap-x-6 gap-y-4">
            <Counter label="Subs Landed" value={subsLanded} onChange={setSubsLanded} />
            <Counter label="Tapped To" value={subsCaught} onChange={setSubsCaught} />
            <Counter label="Sweeps" value={sweeps} onChange={setSweeps} />
            <Counter label="Takedowns" value={takedowns} onChange={setTakedowns} />
            <Counter label="Dom. Positions" value={dominantPositions} onChange={setDominantPositions} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="input resize-none"
            rows={3}
            placeholder="What went well? What needs work? Key observations..."
          />
        </div>

        {/* Reflection — post-session */}
        <div>
          <label className="label">Reflection</label>
          <p className="text-xs text-muted mb-1.5">How did the game plan go? What did you learn?</p>
          <textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            className="input resize-none"
            rows={2}
            placeholder="e.g. The underhook bait worked twice — need to tighten the back take after..."
          />
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || logged}
            className={`btn-primary flex-1 justify-center transition-colors ${logged ? 'bg-green-700 border-green-700' : ''}`}
          >
            {logged ? (
              <>
                <Check size={14} />
                Logged
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : isNew ? 'Record Session' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
