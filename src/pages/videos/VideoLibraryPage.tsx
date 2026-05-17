import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { getCurriculum, getTechniquesForPosition } from '../../data/curriculum'
import type { UserVideo, VideoAttempt, GymSystem } from '../../types/app'
import {
  Plus, Video, Trash2, ExternalLink, ChevronDown, ChevronUp,
  Check, X, Search,
} from 'lucide-react'

const POSITIONS = ['Standing', 'Guard', 'Half Guard', 'Butterfly', 'Mount', 'Back', 'Side Control', 'Submissions', 'Takedowns', 'Other']

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const vid = u.searchParams.get('v') || u.pathname.split('/').pop()
      return vid ? `https://www.youtube.com/embed/${vid}` : null
    }
    if (u.hostname.includes('vimeo.com')) {
      const vid = u.pathname.split('/').pop()
      return vid ? `https://player.vimeo.com/video/${vid}` : null
    }
    return null
  } catch {
    return null
  }
}

export function VideoLibraryPage() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const gymSystem = (profile?.gym_system ?? 'traditional') as GymSystem
  const [showAdd, setShowAdd] = useState(false)
  const [filterPosition, setFilterPosition] = useState<string>('All')
  const [selectedVideo, setSelectedVideo] = useState<UserVideo | null>(null)

  const { data: videos, isLoading } = useQuery({
    queryKey: ['user-videos', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_videos')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as UserVideo[]
    },
  })

  const { data: attemptsRaw } = useQuery({
    queryKey: ['video-attempts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('video_attempts')
        .select('*')
        .eq('user_id', user!.id)
      return (data ?? []) as VideoAttempt[]
    },
  })

  // Index attempts by video_id for O(1) lookup on each card
  const attemptsMap = useMemo(() => {
    const m: Record<string, VideoAttempt> = {}
    for (const a of attemptsRaw ?? []) m[a.video_id] = a
    return m
  }, [attemptsRaw])

  // Slug → display name map for the current gym system
  const techNameMap = useMemo(() => {
    const all = getCurriculum(gymSystem)
    return Object.fromEntries(all.map(t => [t.slug, t.name]))
  }, [gymSystem])

  const filtered = filterPosition === 'All'
    ? (videos ?? [])
    : (videos ?? []).filter(v => v.position === filterPosition)

  const handleVideoSaved = () => {
    setShowAdd(false)
    queryClient.invalidateQueries({ queryKey: ['user-videos'] })
  }

  const handleDelete = async (id: string) => {
    await supabase.from('user_videos').delete().eq('id', id).eq('user_id', user!.id)
    queryClient.invalidateQueries({ queryKey: ['user-videos'] })
    queryClient.invalidateQueries({ queryKey: ['video-attempts'] })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Footage Library</h1>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mt-1">Personal technique reference</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={14} />
          Add Video
        </button>
      </div>

      {/* Position filter */}
      <div className="flex flex-wrap gap-2">
        {['All', ...POSITIONS].map(pos => (
          <button
            key={pos}
            onClick={() => setFilterPosition(pos)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterPosition === pos
                ? 'bg-accent text-white'
                : 'bg-surface-3 text-muted hover:text-gray-300 border border-border'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Video grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-12 flex flex-col items-center gap-3">
          <Video size={24} className="text-muted" />
          <p className="text-muted text-sm">
            {videos?.length === 0
              ? 'No footage saved — build your reference library'
              : `No footage tagged ${filterPosition}`}
          </p>
          {videos?.length === 0 && (
            <button onClick={() => setShowAdd(true)} className="btn-secondary">
              <Plus size={14} />
              Add your first video
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              attempts={attemptsMap[video.id] ?? null}
              techNameMap={techNameMap}
              userId={user!.id}
              onPlay={() => setSelectedVideo(video)}
              onDelete={() => handleDelete(video.id)}
              onAttemptsChanged={() => queryClient.invalidateQueries({ queryKey: ['video-attempts'] })}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddVideoModal
          userId={user!.id}
          gymSystem={gymSystem}
          onClose={() => setShowAdd(false)}
          onSaved={handleVideoSaved}
        />
      )}

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          techNameMap={techNameMap}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  )
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

function VideoCard({
  video,
  attempts,
  techNameMap,
  userId,
  onPlay,
  onDelete,
  onAttemptsChanged,
}: {
  video: UserVideo
  attempts: VideoAttempt | null
  techNameMap: Record<string, string>
  userId: string
  onPlay: () => void
  onDelete: () => void
  onAttemptsChanged: () => void
}) {
  const embedUrl = getEmbedUrl(video.url)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState(video.notes)

  // Refs hold the latest counts so the save always writes the final value,
  // even when multiple taps happen before the async upsert completes.
  const successRef = useRef(attempts?.successful ?? 0)
  const failRef = useRef(attempts?.unsuccessful ?? 0)
  const [successful, setSuccessful] = useState(successRef.current)
  const [unsuccessful, setUnsuccessful] = useState(failRef.current)

  // Sync from server when the query resolves (attempts is null on first render,
  // then fills in once video_attempts loads — useState ignores prop changes after mount).
  useEffect(() => {
    const s = attempts?.successful ?? 0
    const f = attempts?.unsuccessful ?? 0
    successRef.current = s
    failRef.current = f
    setSuccessful(s)
    setUnsuccessful(f)
  }, [attempts])

  const total = successful + unsuccessful
  const successRate = total > 0 ? Math.round((successful / total) * 100) : null

  const incrementAttempt = (type: 'successful' | 'unsuccessful') => {
    if (type === 'successful') {
      successRef.current += 1
      setSuccessful(successRef.current)
    } else {
      failRef.current += 1
      setUnsuccessful(failRef.current)
    }
    supabase.from('video_attempts')
      .upsert({
        user_id: userId,
        video_id: video.id,
        successful: successRef.current,
        unsuccessful: failRef.current,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,video_id' })
      .then(() => onAttemptsChanged())
  }

  const saveNotes = async (val: string) => {
    await supabase
      .from('user_videos')
      .update({ notes: val })
      .eq('id', video.id)
      .eq('user_id', userId)
  }

  return (
    <div className="card overflow-hidden group flex flex-col">
      {/* Thumbnail */}
      <div
        className="aspect-video bg-surface-3 flex items-center justify-center cursor-pointer relative hover:bg-surface-4 transition-colors flex-none"
        onClick={onPlay}
      >
        {embedUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-accent/80 rounded-full flex items-center justify-center group-hover:bg-accent transition-colors">
              <Video size={20} className="text-white ml-0.5" />
            </div>
          </div>
        ) : (
          <ExternalLink size={20} className="text-muted" />
        )}
      </div>

      {/* Title + position */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 leading-tight truncate">{video.title}</p>
            <p className="text-xs text-muted mt-0.5">
              {video.position}{video.sub_position ? ` · ${video.sub_position}` : ''}
            </p>
          </div>
          <button
            onClick={onDelete}
            className="text-muted hover:text-red-400 transition-colors flex-none opacity-0 group-hover:opacity-100 mt-0.5"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Technique tags */}
        {video.technique_slugs?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video.technique_slugs.map(slug => (
              <span
                key={slug}
                className="text-xs bg-accent/15 text-accent border border-accent/30 px-1.5 py-0.5 rounded"
              >
                {techNameMap[slug] ?? slug}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attempt tracker */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => incrementAttempt('successful')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-green-900/40 border border-green-800/60 hover:bg-green-900/70 transition-colors text-xs font-medium text-green-400"
          >
            <Check size={11} />
            {successful}
          </button>
          <button
            onClick={() => incrementAttempt('unsuccessful')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-red-900/30 border border-red-800/50 hover:bg-red-900/60 transition-colors text-xs font-medium text-red-400"
          >
            <X size={11} />
            {unsuccessful}
          </button>
          <span className="text-xs text-muted ml-auto font-mono">
            {successRate !== null ? `${successRate}% success` : 'No attempts'}
          </span>
        </div>
      </div>

      {/* Notes panel */}
      <div className="border-t border-border">
        <button
          onClick={() => setNotesOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted hover:text-gray-300 hover:bg-surface-3 transition-colors"
        >
          <span>Notes{notes ? '' : ' — tap to add'}</span>
          {notesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {notesOpen && (
          <div className="px-4 pb-3">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={e => saveNotes(e.target.value)}
              className="w-full bg-surface-3 border border-border rounded px-3 py-2 text-sm text-gray-300 placeholder:text-muted resize-none focus:outline-none focus:border-accent/60 transition-colors"
              rows={3}
              placeholder="What to focus on, key details, timestamps..."
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── VideoPlayerModal ─────────────────────────────────────────────────────────

function VideoPlayerModal({
  video,
  techNameMap,
  onClose,
}: {
  video: UserVideo
  techNameMap: Record<string, string>
  onClose: () => void
}) {
  const embedUrl = getEmbedUrl(video.url)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3 gap-4">
          <div>
            <p className="text-gray-100 font-medium">{video.title}</p>
            <p className="text-muted text-xs">{video.position}{video.sub_position ? ` · ${video.sub_position}` : ''}</p>
            {video.technique_slugs?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {video.technique_slugs.map(slug => (
                  <span key={slug} className="text-xs bg-accent/15 text-accent border border-accent/30 px-1.5 py-0.5 rounded">
                    {techNameMap[slug] ?? slug}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-gray-300 text-xl flex-none">✕</button>
        </div>
        {embedUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <div className="aspect-video bg-surface-3 rounded-lg flex flex-col items-center justify-center gap-3">
            <p className="text-muted text-sm">Cannot embed this URL</p>
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <ExternalLink size={14} />
              Open in browser
            </a>
          </div>
        )}
        {video.notes && (
          <p className="text-muted text-sm mt-3">{video.notes}</p>
        )}
      </div>
    </div>
  )
}

// ─── TechniqueSelector ────────────────────────────────────────────────────────

function TechniqueSelector({
  gymSystem,
  position,
  selected,
  onChange,
}: {
  gymSystem: GymSystem
  position: string
  selected: string[]
  onChange: (slugs: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const techniques = useMemo(
    () => getTechniquesForPosition(gymSystem, position),
    [gymSystem, position],
  )

  const filtered = search.trim()
    ? techniques.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : techniques

  const toggle = (slug: string) => {
    onChange(selected.includes(slug) ? selected.filter(s => s !== slug) : [...selected, slug])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input flex items-center justify-between text-left w-full"
      >
        <span className={selected.length ? 'text-gray-300' : 'text-muted'}>
          {selected.length === 0
            ? 'Tag techniques…'
            : `${selected.length} technique${selected.length !== 1 ? 's' : ''} tagged`}
        </span>
        <ChevronDown size={14} className="text-muted flex-none" />
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface-2 border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search size={12} className="text-muted flex-none" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search techniques…"
              className="bg-transparent text-sm text-gray-300 placeholder:text-muted outline-none flex-1"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted hover:text-gray-300">
                <X size={12} />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted text-center">No techniques found</p>
            ) : (
              filtered.map(t => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggle(t.slug)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-3 transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-none transition-colors ${
                    selected.includes(t.slug)
                      ? 'bg-accent border-accent'
                      : 'border-border'
                  }`}>
                    {selected.includes(t.slug) && <Check size={10} className="text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-300 truncate">{t.name}</p>
                    <p className="text-xs text-muted">{t.subcategory} · {t.belt}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border px-3 py-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-accent hover:text-accent/80"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AddVideoModal ────────────────────────────────────────────────────────────

function AddVideoModal({
  userId,
  gymSystem,
  onClose,
  onSaved,
}: {
  userId: string
  gymSystem: GymSystem
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [position, setPosition] = useState(POSITIONS[0])
  const [subPosition, setSubPosition] = useState('')
  const [techniqueSlugs, setTechniqueSlugs] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear technique tags when position changes (they may no longer be relevant)
  const handlePositionChange = (pos: string) => {
    setPosition(pos)
    setTechniqueSlugs([])
  }

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('user_videos').insert({
      user_id: userId,
      title: title.trim(),
      url: url.trim(),
      position,
      sub_position: subPosition.trim() || null,
      technique_slugs: techniqueSlugs,
      notes: notes.trim(),
    })
    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="page-title mb-4">Save Footage</h3>
        <div className="space-y-3 mb-5">
          <div>
            <label className="label">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input"
              placeholder="e.g. Berimbolo entry from DLR"
              autoFocus
            />
          </div>
          <div>
            <label className="label">YouTube / Vimeo URL *</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="input"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Position</label>
              <select
                value={position}
                onChange={e => handlePositionChange(e.target.value)}
                className="input"
              >
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sub-position</label>
              <input
                value={subPosition}
                onChange={e => setSubPosition(e.target.value)}
                className="input"
                placeholder="e.g. De La Riva"
              />
            </div>
          </div>
          <div>
            <label className="label">Tag Techniques</label>
            <TechniqueSelector
              gymSystem={gymSystem}
              position={position}
              selected={techniqueSlugs}
              onChange={setTechniqueSlugs}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="What to focus on, key details..."
            />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !url.trim() || saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Video'}
          </button>
        </div>
      </div>
    </div>
  )
}
