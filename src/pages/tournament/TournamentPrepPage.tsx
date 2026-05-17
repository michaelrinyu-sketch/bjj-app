import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tournament, TournamentPrepItem, TournamentStatus } from '../../types/app'
import { Plus, Trophy, Calendar, MapPin, Check, Trash2 } from 'lucide-react'

const STATUS_BADGE: Record<TournamentStatus, string> = {
  planned: 'bg-gray-700 text-gray-300',
  registered: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  completed: 'bg-green-900/50 text-green-300 border border-green-800',
  withdrew: 'bg-red-900/50 text-red-300 border border-red-800',
}

const PREP_CATEGORIES = ['game_plan', 'physical', 'gear', 'logistics', 'mental'] as const
const PREP_CATEGORY_LABELS: Record<string, string> = {
  game_plan: 'Game Plan',
  physical: 'Physical Prep',
  gear: 'Gear & Equipment',
  logistics: 'Logistics',
  mental: 'Mental Prep',
}

export function TournamentPrepPage() {
  const { user } = useAuth()
  const { tournamentId } = useParams<{ tournamentId?: string }>()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(tournamentId ?? null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (tournamentId) setSelectedId(tournamentId)
  }, [tournamentId])

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('user_id', user!.id)
        .order('event_date', { ascending: true })
      return (data ?? []) as Tournament[]
    },
  })

  const { data: prepItems } = useQuery({
    queryKey: ['tournament-prep-items', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data } = await supabase
        .from('tournament_prep_items')
        .select('*')
        .eq('tournament_id', selectedId)
        .eq('user_id', user!.id)
      return (data ?? []) as TournamentPrepItem[]
    },
  })

  const togglePrepItem = useMutation({
    mutationFn: async ({ id, is_complete }: { id: string; is_complete: boolean }) => {
      await supabase.from('tournament_prep_items').update({ is_complete }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournament-prep-items'] }),
  })

  const selectedTournament = tournaments?.find(t => t.id === selectedId)
  const daysUntil = selectedTournament
    ? Math.ceil((new Date(selectedTournament.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Competition Prep</h1>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mt-1">{tournaments?.length ?? 0} competitions on record</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={14} />
          Add Tournament
        </button>
      </div>

      {!tournaments || tournaments.length === 0 ? (
        <div className="card py-12 flex flex-col items-center gap-3">
          <Trophy size={24} className="text-muted" />
          <p className="text-muted text-xs font-mono uppercase tracking-wider">No competitions scheduled</p>
          <button onClick={() => setShowAdd(true)} className="btn-secondary">
            <Plus size={14} />
            Add First Tournament
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tournament list */}
          <div className="space-y-2">
            <p className="section-header mb-3">Competitions</p>
            {tournaments.map(t => {
              const days = Math.ceil((new Date(t.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const isPast = days < 0
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left card px-4 py-3 transition-colors hover:border-border-strong ${
                    selectedId === t.id ? 'border-accent' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-200">{t.name}</p>
                  <p className="text-xs text-muted mt-0.5">{new Date(t.event_date).toLocaleDateString()}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_BADGE[t.status]}`}>
                      {t.status}
                    </span>
                    {!isPast && (
                      <span className="text-xs text-accent font-semibold">{days}d away</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Tournament detail */}
          <div className="md:col-span-2">
            {selectedTournament ? (
              <TournamentDetail
                tournament={selectedTournament}
                daysUntil={daysUntil!}
                prepItems={prepItems ?? []}
                onToggleItem={(id, val) => togglePrepItem.mutate({ id, is_complete: val })}
                userId={user!.id}
                onPrepAdded={() => queryClient.invalidateQueries({ queryKey: ['tournament-prep-items'] })}
                onUpdated={() => queryClient.invalidateQueries({ queryKey: ['tournaments'] })}
                onDeleted={() => {
                  setSelectedId(null)
                  queryClient.invalidateQueries({ queryKey: ['tournaments'] })
                  queryClient.invalidateQueries({ queryKey: ['tournament-prep-items'] })
                }}
              />
            ) : (
              <div className="card py-12 flex items-center justify-center">
                <p className="text-muted text-sm">Select a tournament to see prep details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <AddTournamentModal
          userId={user!.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false)
            queryClient.invalidateQueries({ queryKey: ['tournaments'] })
          }}
        />
      )}
    </div>
  )
}

function TournamentDetail({
  tournament,
  daysUntil,
  prepItems,
  onToggleItem,
  userId,
  onPrepAdded,
  onUpdated,
  onDeleted,
}: {
  tournament: Tournament
  daysUntil: number
  prepItems: TournamentPrepItem[]
  onToggleItem: (id: string, val: boolean) => void
  userId: string
  onPrepAdded: () => void
  onUpdated: () => void
  onDeleted: () => void
}) {
  const [showAddPrep, setShowAddPrep] = useState(false)
  const [editStatus, setEditStatus] = useState(false)
  const [status, setStatus] = useState<TournamentStatus>(tournament.status)
  const [result, setResult] = useState(tournament.result ?? '')
  const [savingStatus, setSavingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const completedCount = prepItems.filter(p => p.is_complete).length

  const handleSaveStatus = async () => {
    setSavingStatus(true)
    await supabase
      .from('tournaments')
      .update({ status, result: result.trim() || null })
      .eq('id', tournament.id)
    setSavingStatus(false)
    setEditStatus(false)
    onUpdated()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${tournament.name}"? This will also delete all prep items.`)) return
    setDeleting(true)
    await supabase.from('tournament_prep_items').delete().eq('tournament_id', tournament.id)
    await supabase.from('tournaments').delete().eq('id', tournament.id)
    onDeleted()
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="card px-5 py-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">{tournament.name}</h2>
            <p className="text-muted text-sm">{tournament.organization}</p>
          </div>
          <div className="flex items-center gap-3">
            {daysUntil >= 0 && (
              <div className="text-right">
                <p className="text-3xl font-bold text-accent">{daysUntil}</p>
                <p className="text-xs text-muted">days away</p>
              </div>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted hover:text-red-400 transition-colors"
              title="Delete tournament"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {new Date(tournament.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          {tournament.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />
              {tournament.location}
            </span>
          )}
        </div>
        {(tournament.weight_class || tournament.division) && (
          <div className="flex gap-3 mt-3">
            {tournament.weight_class && (
              <span className="text-xs bg-surface-3 border border-border px-2 py-1 rounded text-gray-300">{tournament.weight_class}</span>
            )}
            {tournament.division && (
              <span className="text-xs bg-surface-3 border border-border px-2 py-1 rounded text-gray-300">{tournament.division}</span>
            )}
          </div>
        )}
        {tournament.goal && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted mb-1">Goal</p>
            <p className="text-sm text-gray-300">{tournament.goal}</p>
          </div>
        )}

        {/* Status + Result */}
        <div className="mt-3 pt-3 border-t border-border">
          {editStatus ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as TournamentStatus)} className="input">
                    <option value="planned">Planned</option>
                    <option value="registered">Registered</option>
                    <option value="completed">Completed</option>
                    <option value="withdrew">Withdrew</option>
                  </select>
                </div>
                <div>
                  <label className="label">Result</label>
                  <input value={result} onChange={e => setResult(e.target.value)} className="input" placeholder="e.g. Gold, 2-1 record" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveStatus} disabled={savingStatus} className="btn-primary py-1 text-xs">
                  {savingStatus ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditStatus(false)} className="btn-secondary py-1 text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_BADGE[tournament.status]}`}>
                  {tournament.status}
                </span>
                {tournament.result && (
                  <span className="text-sm text-gray-300">{tournament.result}</span>
                )}
              </div>
              <button onClick={() => setEditStatus(true)} className="text-xs text-muted hover:text-gray-300 border border-border px-2 py-0.5 rounded transition-colors">
                Update
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prep checklist */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="text-sm font-semibold text-gray-200">Prep Checklist</p>
            <p className="text-xs text-muted">{completedCount}/{prepItems.length} complete</p>
          </div>
          <button onClick={() => setShowAddPrep(true)} className="btn-ghost">
            <Plus size={14} />
            Add Item
          </button>
        </div>

        {prepItems.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-muted text-sm">No prep items yet</p>
          </div>
        ) : (
          <div>
            {PREP_CATEGORIES.map(cat => {
              const items = prepItems.filter(p => p.category === cat)
              if (items.length === 0) return null
              return (
                <div key={cat}>
                  <p className="px-4 py-2 text-xs text-muted bg-surface-1 border-b border-border">{PREP_CATEGORY_LABELS[cat]}</p>
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0">
                      <button
                        onClick={() => onToggleItem(item.id, !item.is_complete)}
                        className={`w-5 h-5 rounded flex items-center justify-center flex-none transition-colors ${
                          item.is_complete ? 'bg-green-600' : 'bg-surface-4 border border-border'
                        }`}
                      >
                        {item.is_complete && <Check size={11} className="text-white" />}
                      </button>
                      <span className={`text-sm ${item.is_complete ? 'line-through text-muted' : 'text-gray-300'}`}>
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddPrep && (
        <AddPrepItemModal
          tournamentId={tournament.id}
          userId={userId}
          onClose={() => setShowAddPrep(false)}
          onSaved={() => { setShowAddPrep(false); onPrepAdded() }}
        />
      )}
    </div>
  )
}

function AddTournamentModal({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [organization, setOrganization] = useState('')
  const [weightClass, setWeightClass] = useState('')
  const [division, setDivision] = useState('')
  const [goal, setGoal] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !eventDate) return
    setSaving(true)
    await supabase.from('tournaments').insert({
      user_id: userId,
      name: name.trim(),
      event_date: eventDate,
      location: location.trim(),
      organization: organization.trim(),
      weight_class: weightClass.trim(),
      division: division.trim(),
      goal: goal.trim(),
      status: 'planned',
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="page-title mb-4">Add Competition</h3>
        <div className="space-y-3 mb-5">
          <div>
            <label className="label">Tournament Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="e.g. IBJJF New York Open, ADCC Trials" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Organization</label>
              <input value={organization} onChange={e => setOrganization(e.target.value)} className="input" placeholder="IBJJF, NAGA..." />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} className="input" placeholder="City, State" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Weight Class</label>
              <input value={weightClass} onChange={e => setWeightClass(e.target.value)} className="input" placeholder="e.g. 76kg" />
            </div>
            <div>
              <label className="label">Division</label>
              <input value={division} onChange={e => setDivision(e.target.value)} className="input" placeholder="e.g. Adult Blue Belt" />
            </div>
          </div>
          <div>
            <label className="label">Goal</label>
            <input value={goal} onChange={e => setGoal(e.target.value)} className="input" placeholder="e.g. Win gold, get experience..." />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || !eventDate || saving} className="btn-primary">
            {saving ? 'Saving...' : 'Add Tournament'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddPrepItemModal({ tournamentId, userId, onClose, onSaved }: {
  tournamentId: string
  userId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('game_plan')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!description.trim()) return
    setSaving(true)
    await supabase.from('tournament_prep_items').insert({
      tournament_id: tournamentId,
      user_id: userId,
      description: description.trim(),
      category,
      is_complete: false,
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="card p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-100 mb-4">Add Prep Item</h3>
        <div className="space-y-3 mb-4">
          <div>
            <label className="label">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input">
              {PREP_CATEGORIES.map(c => <option key={c} value={c}>{PREP_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Item</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input" placeholder="e.g. Film back take entries" autoFocus />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!description.trim() || saving} className="btn-primary">
            {saving ? 'Saving...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
