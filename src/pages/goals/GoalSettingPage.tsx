import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Goal, GoalStatus, GoalCategory } from '../../types/app'
import { Plus, Target, Check, X, Circle, CheckCircle2 } from 'lucide-react'

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  technique: 'Technique',
  competition: 'Competition',
  fitness: 'Fitness',
  belt_promotion: 'Belt Promotion',
  other: 'Other',
}

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  technique: 'bg-blue-900/50 text-blue-300 border-blue-800',
  competition: 'bg-red-900/50 text-red-300 border-red-800',
  fitness: 'bg-green-900/50 text-green-300 border-green-800',
  belt_promotion: 'bg-amber-900/50 text-amber-300 border-amber-800',
  other: 'bg-gray-700 text-gray-300 border-gray-600',
}

export function GoalSettingPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<GoalStatus | 'all'>('active')

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as Goal[]
    },
  })

  const updateGoal = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      await supabase.from('goals').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })

  const toggleMilestone = (goal: Goal, index: number) => {
    const milestones = [...goal.milestones]
    milestones[index] = { ...milestones[index], complete: !milestones[index].complete }
    updateGoal.mutate({ id: goal.id, updates: { milestones } })
  }

  const filtered = (goals ?? []).filter(g => filter === 'all' || g.status === filter)
  const activeCount = (goals ?? []).filter(g => g.status === 'active').length
  const completedCount = (goals ?? []).filter(g => g.status === 'completed').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Objectives</h1>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mt-1">{activeCount} active · {completedCount} achieved</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={14} />
          Add Goal
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded w-fit">
        {(['active', 'all', 'completed', 'abandoned'] as const).map(f => (
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
        <div className="card py-10 flex flex-col items-center gap-3 text-center">
          <Target size={22} className="text-muted" />
          {goals?.length === 0 ? (
            <>
              <div>
                <p className="text-gray-400 text-sm font-medium">Unguided rolling builds habits.</p>
                <p className="text-muted text-xs mt-1">Goals build fighters.</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="btn-primary text-xs">
                <Plus size={14} />
                Set first objective
              </button>
            </>
          ) : (
            <p className="text-muted text-sm">No {filter} objectives</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onComplete={() => updateGoal.mutate({ id: goal.id, updates: { status: 'completed' } })}
              onAbandon={() => updateGoal.mutate({ id: goal.id, updates: { status: 'abandoned' } })}
              onReactivate={() => updateGoal.mutate({ id: goal.id, updates: { status: 'active' } })}
              onToggleMilestone={(i) => toggleMilestone(goal, i)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddGoalModal
          userId={user!.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false)
            queryClient.invalidateQueries({ queryKey: ['goals'] })
          }}
        />
      )}
    </div>
  )
}

function GoalCard({
  goal,
  onComplete,
  onAbandon,
  onReactivate,
  onToggleMilestone,
}: {
  goal: Goal
  onComplete: () => void
  onAbandon: () => void
  onReactivate: () => void
  onToggleMilestone: (i: number) => void
}) {
  const [flashing, setFlashing] = useState(false)
  const completedMilestones = goal.milestones?.filter(m => m.complete).length ?? 0
  const totalMilestones = goal.milestones?.length ?? 0
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  const handleComplete = () => {
    setFlashing(true)
    setTimeout(() => { setFlashing(false); onComplete() }, 600)
  }

  return (
    <div className={`card overflow-hidden transition-colors ${goal.status === 'completed' ? 'opacity-70' : ''} ${flashing ? 'animate-flash-success' : ''}`}>
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {goal.status === 'completed'
              ? <CheckCircle2 size={18} className="text-green-500 flex-none mt-0.5" />
              : <Circle size={18} className="text-accent flex-none mt-0.5" />}
            <div className="flex-1">
              <p className={`text-sm font-medium ${goal.status === 'completed' ? 'text-muted line-through' : 'text-gray-200'}`}>
                {goal.title}
              </p>
              {goal.description && (
                <p className="text-xs text-muted mt-0.5">{goal.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[goal.category]}`}>
                  {CATEGORY_LABELS[goal.category]}
                </span>
                {goal.target_date && (
                  <span className="text-xs text-muted">
                    by {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-none">
            {goal.status === 'active' && (
              <>
                <button onClick={handleComplete} className="text-xs text-green-400 hover:text-green-300 border border-green-800 px-2 py-0.5 rounded transition-colors">
                  Complete
                </button>
                <button onClick={onAbandon} className="text-muted hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </>
            )}
            {goal.status !== 'active' && (
              <button onClick={onReactivate} className="text-xs text-muted hover:text-gray-300 border border-border px-2 py-0.5 rounded">
                Reactivate
              </button>
            )}
          </div>
        </div>

        {/* Milestone progress bar */}
        {totalMilestones > 0 && (
          <div className="mt-3 pl-7">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted">Milestones</p>
              <p className="text-xs text-muted">{completedMilestones}/{totalMilestones}</p>
            </div>
            <div className="w-full bg-surface-4 rounded-full h-1.5 mb-3">
              <div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-1.5">
              {goal.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleMilestone(i)}
                    className={`w-4 h-4 rounded flex items-center justify-center flex-none transition-colors ${
                      m.complete ? 'bg-green-600' : 'bg-surface-4 border border-border'
                    }`}
                  >
                    {m.complete && <Check size={9} className="text-white" />}
                  </button>
                  <span className={`text-xs ${m.complete ? 'line-through text-muted' : 'text-gray-400'}`}>{m.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AddGoalModal({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('technique')
  const [targetDate, setTargetDate] = useState('')
  const [milestoneInput, setMilestoneInput] = useState('')
  const [milestones, setMilestones] = useState<{ text: string; complete: boolean }[]>([])
  const [saving, setSaving] = useState(false)

  const addMilestone = () => {
    const t = milestoneInput.trim()
    if (t) {
      setMilestones([...milestones, { text: t, complete: false }])
      setMilestoneInput('')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('goals').insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      target_date: targetDate || null,
      status: 'active',
      milestones,
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="page-title mb-4">New Objective</h3>
        <div className="space-y-3 mb-5">
          <div>
            <label className="label">Goal *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="e.g. Hit berimbolo from DLR in sparring" autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input resize-none" rows={2} placeholder="More details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as GoalCategory)} className="input">
                {(Object.keys(CATEGORY_LABELS) as GoalCategory[]).map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Target Date</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Milestones</label>
            <div className="flex gap-2 mb-2">
              <input
                value={milestoneInput}
                onChange={e => setMilestoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                className="input"
                placeholder="Add a milestone step"
              />
              <button onClick={addMilestone} className="btn-secondary flex-none">
                <Plus size={14} />
              </button>
            </div>
            {milestones.length > 0 && (
              <div className="space-y-1.5">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Circle size={12} className="text-muted flex-none" />
                    <span className="text-sm text-gray-400 flex-1">{m.text}</span>
                    <button onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} className="text-muted hover:text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || saving} className="btn-primary">
            {saving ? 'Saving...' : 'Add Goal'}
          </button>
        </div>
      </div>
    </div>
  )
}
