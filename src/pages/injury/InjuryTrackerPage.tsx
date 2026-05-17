import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Injury, InjurySeverity } from '../../types/app'
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react'

const SEVERITY_COLORS: Record<InjurySeverity, string> = {
  minor: 'bg-yellow-900/50 text-yellow-300 border border-yellow-800',
  moderate: 'bg-orange-900/50 text-orange-300 border border-orange-800',
  severe: 'bg-red-900/50 text-red-300 border border-red-800',
}

const BODY_PARTS = [
  'Neck', 'Left Shoulder', 'Right Shoulder', 'Left Elbow', 'Right Elbow',
  'Left Wrist', 'Right Wrist', 'Left Hand/Finger', 'Right Hand/Finger',
  'Ribs', 'Lower Back', 'Left Hip', 'Right Hip',
  'Left Knee', 'Right Knee', 'Left Ankle', 'Right Ankle',
  'Left Foot/Toe', 'Right Foot/Toe', 'Head/Concussion', 'Other',
]

const INJURY_TYPES = ['Sprain', 'Strain', 'Bruise', 'Partial Tear', 'Full Tear', 'Fracture', 'Dislocation', 'Concussion', 'Other']

export function InjuryTrackerPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'recovered'>('all')

  const { data: injuries, isLoading } = useQuery({
    queryKey: ['injuries', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', user!.id)
        .order('occurred_on', { ascending: false })
      return (data ?? []) as Injury[]
    },
  })

  const resolveInjury = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('injuries').update({
        is_active: false,
        resolved_on: new Date().toISOString().split('T')[0],
      }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['injuries'] }),
  })

  const filtered = (injuries ?? []).filter(i => {
    if (filter === 'active') return i.is_active
    if (filter === 'recovered') return !i.is_active
    return true
  })

  const activeCount = (injuries ?? []).filter(i => i.is_active).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Injury Log</h1>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mt-1">
            {activeCount > 0
              ? `${activeCount} active ${activeCount === 1 ? 'injury' : 'injuries'} — modify training`
              : 'All clear — full capacity'}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={14} />
          Log Injury
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded w-fit">
        {(['all', 'active', 'recovered'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-surface-4 text-gray-100' : 'text-muted hover:text-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-12 flex flex-col items-center gap-3">
          <CheckCircle size={24} className="text-green-500" />
          <p className="text-muted text-sm">
            {injuries?.length === 0 ? 'No injuries on record' : `No ${filter} injuries`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(injury => (
            <InjuryCard
              key={injury.id}
              injury={injury}
              onResolve={() => resolveInjury.mutate(injury.id)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddInjuryModal
          userId={user!.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false)
            queryClient.invalidateQueries({ queryKey: ['injuries'] })
          }}
        />
      )}
    </div>
  )
}

function InjuryCard({ injury, onResolve }: { injury: Injury; onResolve: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`card overflow-hidden ${injury.is_active ? 'border-amber-900' : ''}`}>
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-3 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {injury.is_active
            ? <AlertTriangle size={16} className="text-amber-500 flex-none" />
            : <CheckCircle size={16} className="text-green-500 flex-none" />}
          <div>
            <p className="text-sm font-medium text-gray-200">{injury.body_part}</p>
            <p className="text-xs text-muted">{injury.injury_type} · {new Date(injury.occurred_on).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded capitalize ${SEVERITY_COLORS[injury.severity]}`}>
            {injury.severity}
          </span>
          {injury.is_active && (
            <button
              onClick={e => { e.stopPropagation(); onResolve() }}
              className="text-xs text-green-400 hover:text-green-300 border border-green-800 px-2 py-0.5 rounded"
            >
              Mark Recovered
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border space-y-2 pt-3">
          {injury.description && <p className="text-sm text-gray-300">{injury.description}</p>}
          {injury.notes && <p className="text-sm text-muted">{injury.notes}</p>}
          {injury.resolved_on && (
            <p className="text-xs text-green-400">Resolved: {new Date(injury.resolved_on).toLocaleDateString()}</p>
          )}
          {injury.affected_techniques?.length > 0 && (
            <div>
              <p className="text-xs text-muted mb-1">Avoid these techniques:</p>
              <div className="flex flex-wrap gap-1">
                {injury.affected_techniques.map(t => (
                  <span key={t} className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddInjuryModal({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [bodyPart, setBodyPart] = useState(BODY_PARTS[0])
  const [injuryType, setInjuryType] = useState(INJURY_TYPES[0])
  const [severity, setSeverity] = useState<InjurySeverity>('minor')
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('injuries').insert({
      user_id: userId,
      body_part: bodyPart,
      injury_type: injuryType,
      severity,
      occurred_on: occurredOn,
      description: description.trim(),
      notes: notes.trim(),
      is_active: true,
      affected_techniques: [],
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="page-title mb-4">Log Injury</h3>
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Body Part</label>
              <select value={bodyPart} onChange={e => setBodyPart(e.target.value)} className="input">
                {BODY_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Injury Type</label>
              <select value={injuryType} onChange={e => setInjuryType(e.target.value)} className="input">
                {INJURY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as InjurySeverity)} className="input">
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={occurredOn} onChange={e => setOccurredOn(e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input" placeholder="How did it happen?" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input resize-none" rows={2} placeholder="Modified training, treatment plan..." />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Log Injury'}
          </button>
        </div>
      </div>
    </div>
  )
}
