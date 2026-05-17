import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { TrainingSession, SessionType } from '../../types/app'
import { Plus, ClipboardList, Search, Flame, Clock, Swords, Shield, RefreshCw, ArrowDownToLine, Layers } from 'lucide-react'

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  gi: 'Gi',
  nogi: 'No-Gi',
  open_mat: 'Open Mat',
  drilling: 'Drilling',
  competition: 'Competition',
}

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  gi: 'bg-blue-900/50 text-blue-300 border-blue-800',
  nogi: 'bg-purple-900/50 text-purple-300 border-purple-800',
  open_mat: 'bg-green-900/50 text-green-300 border-green-800',
  drilling: 'bg-amber-900/50 text-amber-300 border-amber-800',
  competition: 'bg-red-900/50 text-red-300 border-red-800',
}

export function TrainingLogPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<SessionType | 'all'>('all')

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['training-sessions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('session_date', { ascending: false })
      return (data ?? []) as TrainingSession[]
    },
  })

  const filtered = (sessions ?? []).filter(s => {
    const matchType = filterType === 'all' || s.session_type === filterType
    const q = search.toLowerCase()
    const matchSearch = !search ||
      s.notes?.toLowerCase().includes(q) ||
      s.game_plan?.toLowerCase().includes(q) ||
      s.reflection?.toLowerCase().includes(q) ||
      s.techniques_drilled?.some((t: string) => t.toLowerCase().includes(q))
    return matchType && matchSearch
  })

  // Stats
  const totalMinutes = (sessions ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
  const totalHours = Math.round(totalMinutes / 60)
  const totalRounds = (sessions ?? []).reduce((sum, s) => sum + (s.sparring_rounds ?? 0), 0)
  const thisMonthSessions = (sessions ?? []).filter(s => {
    const d = new Date(s.session_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // Cumulative combat stats
  const totalSubsLanded     = (sessions ?? []).reduce((n, s) => n + (s.submissions_landed ?? 0), 0)
  const totalSubsCaught     = (sessions ?? []).reduce((n, s) => n + (s.submissions_caught ?? 0), 0)
  const totalSweeps         = (sessions ?? []).reduce((n, s) => n + (s.sweeps ?? 0), 0)
  const totalTakedowns      = (sessions ?? []).reduce((n, s) => n + (s.takedowns ?? 0), 0)
  const totalDomPositions   = (sessions ?? []).reduce((n, s) => n + (s.dominant_positions ?? 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Mat Log</h1>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mt-1">{sessions?.length ?? 0} sessions on record</p>
        </div>
        <Link to="/training-log/new" className="btn-primary">
          <Plus size={14} />
          Record Session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card px-4 py-3 text-center border-t-2 border-t-accent">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Flame size={13} className="text-accent" />
            <span className="section-header">This Month</span>
          </div>
          <p className="text-3xl font-black text-gray-100 font-mono leading-none">{thisMonthSessions}</p>
        </div>
        <div className="card px-4 py-3 text-center border-t-2 border-t-surface-4">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Clock size={13} className="text-accent" />
            <span className="section-header">Mat Hours</span>
          </div>
          <p className="text-3xl font-black text-gray-100 font-mono leading-none">{totalHours}</p>
        </div>
        <div className="card px-4 py-3 text-center border-t-2 border-t-surface-4">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Swords size={13} className="text-accent" />
            <span className="section-header">Sparring Rounds</span>
          </div>
          <p className="text-3xl font-black text-gray-100 font-mono leading-none">{totalRounds}</p>
        </div>
      </div>

      {/* Cumulative combat stats */}
      {(sessions?.length ?? 0) > 0 && (
        <div className="card px-4 py-3">
          <p className="section-header mb-3">Combat Totals</p>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center mb-1"><Swords size={13} className="text-accent" /></div>
              <p className="text-xl font-black font-mono text-gray-100">{totalSubsLanded}</p>
              <p className="text-xs text-muted mt-0.5">Subs</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-1"><Shield size={13} className="text-amber-400" /></div>
              <p className="text-xl font-black font-mono text-gray-100">{totalSubsCaught}</p>
              <p className="text-xs text-muted mt-0.5">Tapped</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-1"><RefreshCw size={13} className="text-blue-400" /></div>
              <p className="text-xl font-black font-mono text-gray-100">{totalSweeps}</p>
              <p className="text-xs text-muted mt-0.5">Sweeps</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-1"><ArrowDownToLine size={13} className="text-green-400" /></div>
              <p className="text-xl font-black font-mono text-gray-100">{totalTakedowns}</p>
              <p className="text-xs text-muted mt-0.5">Takedowns</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-1"><Layers size={13} className="text-purple-400" /></div>
              <p className="text-xl font-black font-mono text-gray-100">{totalDomPositions}</p>
              <p className="text-xs text-muted mt-0.5">Dom. Pos.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by technique, notes..."
            className="input pl-8"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterType === 'all' ? 'bg-accent text-white' : 'bg-surface-3 text-muted border border-border'
            }`}
          >
            All
          </button>
          {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterType === type ? 'bg-accent text-white' : 'bg-surface-3 text-muted border border-border'
              }`}
            >
              {SESSION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-12 flex flex-col items-center gap-3">
          <ClipboardList size={24} className="text-muted" />
          {sessions?.length === 0 ? (
            <>
              <div className="text-center">
                <p className="text-gray-400 text-sm font-medium">No mat time recorded.</p>
                <p className="text-muted text-xs mt-1">Every black belt started with a blank log.</p>
              </div>
              <Link to="/training-log/new" className="btn-primary">
                <Plus size={14} />
                Record First Session
              </Link>
            </>
          ) : (
            <p className="text-muted text-sm">No sessions match that filter</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(session => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}

function SessionRow({ session }: { session: TrainingSession }) {
  const date = new Date(session.session_date)
  const colorClass = SESSION_TYPE_COLORS[session.session_type] ?? 'bg-surface-3 text-gray-300 border-border'

  return (
    <Link
      to={`/training-log/${session.id}`}
      className="card px-4 py-3 flex items-center gap-4 hover:border-border-strong transition-colors group"
    >
      {/* Date */}
      <div className="flex-none w-14 text-center">
        <p className="text-xs text-muted">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
        <p className="text-xl font-semibold text-gray-100 leading-none">{date.getDate()}</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 border font-mono font-bold uppercase tracking-wider ${colorClass}`}>
            {SESSION_TYPE_LABELS[session.session_type]}
          </span>
          <span className="text-xs text-muted font-mono">{session.duration_minutes}min</span>
          {session.sparring_rounds > 0 && (
            <span className="text-xs text-muted font-mono">{session.sparring_rounds}R</span>
          )}
        </div>
        {(session.game_plan || session.notes) && (
          <p className="text-sm text-gray-400 truncate">{session.game_plan || session.notes}</p>
        )}
        {session.techniques_drilled?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {session.techniques_drilled.slice(0, 3).map((t: string) => (
              <span key={t} className="text-xs bg-surface-3 text-muted px-1.5 py-0.5 rounded">{t}</span>
            ))}
            {session.techniques_drilled.length > 3 && (
              <span className="text-xs text-muted">+{session.techniques_drilled.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Energy */}
      <div className="flex-none flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 h-5 rounded-sm ${i < (session.energy_level ?? 0) ? 'bg-accent' : 'bg-surface-4'}`}
          />
        ))}
      </div>
    </Link>
  )
}
