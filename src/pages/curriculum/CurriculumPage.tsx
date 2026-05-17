import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { getCurriculumGrouped, getCurriculum } from '../../data/curriculum'
import type { Technique } from '../../data/curriculum'
import { BELT_LABELS, GYM_SYSTEM_LABELS } from '../../types/app'
import type { GymSystem, BeltLevel, TechniqueStatus, UserVideo, VideoAttempt } from '../../types/app'
import { Check, ChevronDown, ChevronRight, Plus, Lock, TrendingUp, X, Video } from 'lucide-react'
import { PositionIllustration } from '../../components/PositionIllustration'

const BELT_ORDER: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black']
const BELT_BADGE: Record<BeltLevel, string> = {
  white: 'bg-gray-100 text-gray-900',
  blue: 'bg-blue-600 text-white',
  purple: 'bg-purple-700 text-white',
  brown: 'bg-amber-800 text-white',
  black: 'bg-neutral-800 text-white',
}
const STATUS_COLOR: Record<TechniqueStatus, string> = {
  unseen: 'bg-surface-4',
  learning: 'bg-yellow-600',
  drilling: 'bg-blue-600',
  comfortable: 'bg-green-600',
}
const STATUS_LABEL: Record<TechniqueStatus, string> = {
  unseen: 'Not Seen',
  learning: 'Introduced',
  drilling: 'Drilling',
  comfortable: 'Sharp',
}

export function CurriculumPage() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [gymSystem, setGymSystem] = useState<GymSystem>((profile?.gym_system ?? 'traditional') as GymSystem)
  const [selectedBelt, setSelectedBelt] = useState<BeltLevel>(profile?.belt_level ?? 'white')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [showAddTechnique, setShowAddTechnique] = useState(false)
  // Local display state — updated synchronously on click so rapid clicks work correctly.
  // Seeded from server data; does not reset on every background refetch.
  const [displayStatuses, setDisplayStatuses] = useState<Record<string, TechniqueStatus>>({})
  const seededForSystem = useRef<string | null>(null)

  const grouped = getCurriculumGrouped(gymSystem, selectedBelt)
  const allTechniques = getCurriculum(gymSystem).filter(t => t.belt === selectedBelt)

  const { data: progressMap } = useQuery({
    queryKey: ['technique-progress', user?.id, gymSystem],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('technique_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('gym_system', gymSystem)
      const map: Record<string, TechniqueStatus> = {}
      for (const row of data ?? []) map[row.technique_slug] = row.status
      return map
    },
  })

  // Seed displayStatuses from server once per gymSystem (not on every background refetch).
  useEffect(() => {
    if (progressMap && seededForSystem.current !== gymSystem) {
      setDisplayStatuses(progressMap)
      seededForSystem.current = gymSystem
    }
  }, [progressMap, gymSystem])

  // When gymSystem changes, reset display so the new system's data loads in.
  useEffect(() => {
    setDisplayStatuses({})
    seededForSystem.current = null
  }, [gymSystem])

  const saveStatus = useMutation({
    mutationFn: async ({ slug, status }: { slug: string; status: TechniqueStatus }) => {
      const { error } = await supabase.from('technique_progress').upsert({
        user_id: user!.id,
        technique_slug: slug,
        gym_system: gymSystem,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,technique_slug' })
      if (error) throw error
    },
    onError: (_err, { slug }) => {
      // Roll back the display status for this slug to whatever the server last gave us.
      setDisplayStatuses(prev => ({
        ...prev,
        [slug]: progressMap?.[slug] ?? 'unseen',
      }))
    },
  })

  // Direct-set (used by progression suggestion confirm buttons)
  const setStatus = (slug: string, status: TechniqueStatus) => {
    setDisplayStatuses(prev => ({ ...prev, [slug]: status }))
    saveStatus.mutate({ slug, status })
  }

  // ── Progression suggestions from video attempt data ──────────────────────────

  const { data: videoAttemptData } = useQuery({
    queryKey: ['video-attempt-totals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: videos }, { data: attempts }] = await Promise.all([
        supabase.from('user_videos').select('id, technique_slugs, url').eq('user_id', user!.id),
        supabase.from('video_attempts').select('video_id, successful, unsuccessful').eq('user_id', user!.id),
      ])
      const attemptsByVideo = new Map(
        (attempts ?? []).map((a: Pick<VideoAttempt, 'video_id' | 'successful' | 'unsuccessful'>) => [a.video_id, a])
      )
      const totals: Record<string, { successful: number; unsuccessful: number; videoUrl?: string }> = {}
      // Single pass: capture video URL for each slug + accumulate attempts
      for (const video of (videos ?? []) as Pick<UserVideo, 'id' | 'technique_slugs'>[]) {
        const a = attemptsByVideo.get((video as any).id)
        for (const slug of ((video as any).technique_slugs ?? [])) {
          if (!totals[slug]) totals[slug] = { successful: 0, unsuccessful: 0, videoUrl: (video as any).url || undefined }
          else if (!totals[slug].videoUrl && (video as any).url) totals[slug].videoUrl = (video as any).url
          if (a) {
            totals[slug].successful += a.successful
            totals[slug].unsuccessful += a.unsuccessful
          }
        }
      }
      return totals
    },
  })

  // Map slug → Technique for the current system (all belts)
  const allTechsBySlug = useMemo(() => {
    const all = getCurriculum(gymSystem)
    return Object.fromEntries(all.map(t => [t.slug, t]))
  }, [gymSystem])

  // Compute which techniques have crossed a threshold above their current status
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())

  const suggestions = useMemo(() => {
    if (!videoAttemptData) return []
    return Object.entries(videoAttemptData)
      .map(([slug, { successful, unsuccessful }]) => {
        if (dismissedSuggestions.has(slug)) return null
        const current = displayStatuses[slug] ?? 'unseen'
        const total = successful + unsuccessful
        const rate = total > 0 ? successful / total : 0
        let suggestedStatus: TechniqueStatus | null = null
        if (current === 'unseen' && successful >= 3) suggestedStatus = 'learning'
        else if (current === 'learning' && successful >= 10) suggestedStatus = 'drilling'
        else if (current === 'drilling' && successful >= 25 && rate >= 0.6) suggestedStatus = 'comfortable'
        if (!suggestedStatus) return null
        const technique = allTechsBySlug[slug]
        if (!technique) return null
        return { slug, technique, current, suggestedStatus, successful, unsuccessful, rate }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .slice(0, 5) // cap at 5 at once so the banner doesn't overwhelm
  }, [videoAttemptData, displayStatuses, allTechsBySlug, dismissedSuggestions])

  const STATUS_NEXT_LABEL: Record<TechniqueStatus, string> = {
    unseen: 'Mark Introduced',
    learning: 'Advance to Drilling',
    drilling: 'Mark Sharp',
    comfortable: '',
  }

  const cycleStatus = (slug: string) => {
    const cycle: TechniqueStatus[] = ['unseen', 'learning', 'drilling', 'comfortable']
    // Read from displayStatuses — updated synchronously, so rapid clicks always see the latest value.
    const current = displayStatuses[slug] ?? 'unseen'
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length]
    setDisplayStatuses(prev => ({ ...prev, [slug]: next }))
    saveStatus.mutate({ slug, status: next })
  }

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const completedCount = allTechniques.filter(t => displayStatuses[t.slug] === 'comfortable').length
  const startedCount = allTechniques.filter(t => displayStatuses[t.slug] && displayStatuses[t.slug] !== 'unseen').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Technique Map</h1>
        </div>
        <button onClick={() => setShowAddTechnique(true)} className="btn-secondary">
          <Plus size={14} />
          Add Technique
        </button>
      </div>

      {/* Gym system switcher */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(GYM_SYSTEM_LABELS) as [GymSystem, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setGymSystem(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              gymSystem === key
                ? 'bg-accent text-white border-accent'
                : 'bg-surface-2 text-muted border-border hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Progression suggestions from footage attempts */}
      {suggestions.length > 0 && (
        <div className="card border border-accent/30 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 border-b border-accent/20">
            <TrendingUp size={14} className="text-accent" />
            <p className="text-xs font-semibold text-accent">
              {suggestions.length} technique{suggestions.length !== 1 ? 's' : ''} ready to advance
            </p>
            <p className="text-xs text-muted ml-1">— based on your footage attempt tallies</p>
          </div>
          <div className="divide-y divide-border">
            {suggestions.map(s => (
              <div key={s.slug} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{s.technique.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {s.successful} successful · {s.unsuccessful} missed
                    {s.rate > 0 && ` · ${Math.round(s.rate * 100)}% success rate`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStatus(s.slug, s.suggestedStatus)
                    setDismissedSuggestions(prev => new Set([...prev, s.slug]))
                  }}
                  className="btn-primary text-xs py-1 px-2.5 flex-none"
                >
                  {STATUS_NEXT_LABEL[s.current]}
                </button>
                <button
                  onClick={() => setDismissedSuggestions(prev => new Set([...prev, s.slug]))}
                  className="text-muted hover:text-gray-300 flex-none"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Belt tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-lg w-fit">
        {BELT_ORDER.map(belt => (
          <button
            key={belt}
            onClick={() => setSelectedBelt(belt)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              selectedBelt === belt
                ? BELT_BADGE[belt]
                : 'text-muted hover:text-gray-300'
            }`}
          >
            {BELT_LABELS[belt].replace(' Belt', '')}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {allTechniques.length > 0 && (
        <div className="card px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono text-gray-300">
              {startedCount} / {allTechniques.length} started
            </p>
            <p className="text-xs font-mono font-bold text-green-400">
              {completedCount} drilled to comfort
            </p>
          </div>
          <div className="w-full bg-surface-4 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${allTechniques.length ? (startedCount / allTechniques.length) * 100 : 0}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3">
            {Object.entries(STATUS_LABEL).map(([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${STATUS_COLOR[status as TechniqueStatus]}`} />
                <span className="text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technique tree */}
      {gymSystem === 'custom' ? (
        <div className="card py-12 flex flex-col items-center gap-3">
          <Plus size={24} className="text-muted" />
          <p className="text-muted text-sm">Custom curriculum — add your own techniques</p>
          <button onClick={() => setShowAddTechnique(true)} className="btn-primary">
            <Plus size={14} />
            Add First Technique
          </button>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card py-12 flex flex-col items-center gap-3">
          <Lock size={24} className="text-muted" />
          <p className="text-muted text-sm">No techniques defined for this belt level yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([category, subcategories]) => {
            const allInCategory = Object.values(subcategories).flat()
            const doneInCategory = allInCategory.filter(t => displayStatuses[t.slug] === 'comfortable').length
            const isExpanded = expandedCategories[category] ?? true

            return (
              <div key={category} className="card overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
                    <span className="text-sm font-semibold text-gray-200">{category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">{doneInCategory}/{allInCategory.length}</span>
                    <PositionIllustration category={category} size="sm" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Larger illustration at top of expanded section */}
                    <div className="flex items-center gap-4 px-4 py-3 bg-surface-1 border-b border-border">
                      <PositionIllustration category={category} size="md" />
                      <div>
                        <p className="text-xs font-bold font-mono uppercase tracking-wider text-gray-300">{category}</p>
                        <p className="text-xs text-muted mt-0.5">{allInCategory.length} techniques · {doneInCategory} sharp</p>
                      </div>
                    </div>
                    {Object.entries(subcategories).map(([sub, techniques]) => (
                      <div key={sub}>
                        <p className="px-4 py-2 text-xs text-muted bg-surface-1 border-b border-border">{sub}</p>
                        {techniques.map(technique => (
                          <TechniqueRow
                            key={technique.slug}
                            technique={technique}
                            status={displayStatuses[technique.slug] ?? 'unseen'}
                            attempts={videoAttemptData?.[technique.slug]}
                            onCycle={() => cycleStatus(technique.slug)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add technique modal placeholder */}
      {showAddTechnique && (
        <AddTechniqueModal
          onClose={() => setShowAddTechnique(false)}
          userId={user!.id}
          gymSystem={gymSystem}
          belt={selectedBelt}
          onSaved={() => {
            setShowAddTechnique(false)
            queryClient.invalidateQueries({ queryKey: ['technique-progress'] })
          }}
        />
      )}
    </div>
  )
}

function TechniqueRow({
  technique,
  status,
  attempts,
  onCycle,
}: {
  technique: Technique
  status: TechniqueStatus
  attempts?: { successful: number; unsuccessful: number; videoUrl?: string }
  onCycle: () => void
}) {
  const [popping, setPopping] = useState(false)
  const total = (attempts?.successful ?? 0) + (attempts?.unsuccessful ?? 0)
  const successful = attempts?.successful ?? 0
  const videoUrl = attempts?.videoUrl
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(technique.name + ' BJJ tutorial')}`
  const refUrl = videoUrl ?? youtubeUrl

  const handleClick = () => {
    setPopping(true)
    onCycle()
    setTimeout(() => setPopping(false), 250)
  }

  return (
    <div className="flex items-center border-b border-border last:border-b-0 hover:bg-surface-3 transition-colors group">
      <button
        onClick={handleClick}
        title={`Status: ${STATUS_LABEL[status]} — click to advance`}
        className="flex-1 flex items-center gap-3 px-4 py-2.5 text-left min-w-0"
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center flex-none transition-colors ${STATUS_COLOR[status]} ${popping ? 'animate-pop' : ''}`}>
          {status === 'comfortable' && <Check size={11} className="text-white" />}
        </div>
        <span className={`text-sm truncate ${status === 'comfortable' ? 'text-muted line-through' : 'text-gray-300'}`}>
          {technique.name}
        </span>
      </button>
      <div className="flex items-center gap-2 pr-3 flex-none">
        {total > 0 && (
          <span className="text-xs font-mono text-muted whitespace-nowrap">
            {successful}/{total}
          </span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[status]} text-white opacity-60 group-hover:opacity-100`}>
          {STATUS_LABEL[status]}
        </span>
        <a
          href={refUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title={videoUrl ? 'Open your saved footage' : 'Search YouTube for tutorial'}
          className={`flex-none w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-surface-4 ${
            videoUrl ? 'text-accent' : 'text-muted hover:text-gray-400'
          }`}
        >
          <Video size={12} />
        </a>
      </div>
    </div>
  )
}

function AddTechniqueModal({
  onClose,
  userId,
  gymSystem,
  onSaved,
}: {
  onClose: () => void
  userId: string
  gymSystem: string
  belt?: BeltLevel
  onSaved: () => void
}) {
  const [name, setName] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const slug = `custom-${userId.slice(0, 8)}-${Date.now()}`
    await supabase.from('technique_progress').upsert({
      user_id: userId,
      technique_slug: slug,
      gym_system: gymSystem,
      status: 'learning' as TechniqueStatus,
      notes: `Custom technique: ${name}${category ? ` (${category})` : ''}`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,technique_slug' })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="page-title mb-4">Add Technique</h3>
        <div className="space-y-3 mb-5">
          <div>
            <label className="label">Technique Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="e.g. K-guard entry from seated guard" autoFocus />
          </div>
          <div>
            <label className="label">Category (optional)</label>
            <input value={category} onChange={e => setCategory(e.target.value)} className="input" placeholder="e.g. Guard, Passing" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || saving} className="btn-primary">
            {saving ? 'Saving...' : 'Add Technique'}
          </button>
        </div>
      </div>
    </div>
  )
}

