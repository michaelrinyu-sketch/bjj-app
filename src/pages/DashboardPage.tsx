import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { BELT_LABELS, BELT_COLORS } from '../types/app'
import {
  ClipboardList, BookOpen, Target, Trophy, AlertTriangle,
  TrendingUp, Timer, Users, Flame, Dumbbell,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const GOAL_HOURS = 10_000
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function computeStreak(sessions: { session_date: string }[]): number {
  if (sessions.length === 0) return 0
  const unique = [...new Set(sessions.map(s => s.session_date))].sort().reverse()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  let expected = new Date(today)
  for (const dateStr of unique) {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((expected.getTime() - d.getTime()) / 86400000)
    if (diff === 0 || (streak === 0 && diff === 1)) {
      streak++
      expected = new Date(d)
      expected.setDate(expected.getDate() - 1)
    } else if (diff === 1) {
      streak++
      expected = new Date(d)
      expected.setDate(expected.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function DashboardPage() {
  const { user, profile } = useAuth()

  const { data: recentSessions } = useQuery({
    queryKey: ['training-sessions-recent', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('session_date', { ascending: false })
        .limit(5)
      return data ?? []
    },
  })

  const { data: activeGoals } = useQuery({
    queryKey: ['goals-active', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .limit(3)
      return data ?? []
    },
  })

  const { data: upcomingTournaments } = useQuery({
    queryKey: ['tournaments-upcoming', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('user_id', user!.id)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(3)
      return data ?? []
    },
  })

  const { data: allSessionData } = useQuery({
    queryKey: ['sessions-all-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('duration_minutes, session_date')
        .eq('user_id', user!.id)
      return (data ?? []) as { duration_minutes: number; session_date: string }[]
    },
  })

  const { data: activeInjuries } = useQuery({
    queryKey: ['injuries-active', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
      return data ?? []
    },
  })

  const { data: inactivePartners } = useQuery({
    queryKey: ['dashboard-inactive-partners', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: connections } = await supabase
        .from('partner_connections')
        .select('partner_id, profiles!partner_connections_partner_id_fkey(display_name)')
        .eq('user_id', user!.id)
      if (!connections || connections.length === 0) return []
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const partnerIds = connections.map((c: any) => c.partner_id)
      const { data: recentPartnerSessions } = await supabase
        .from('training_sessions')
        .select('user_id')
        .in('user_id', partnerIds)
        .gte('session_date', twoWeeksAgo)
      const activeIds = new Set((recentPartnerSessions ?? []).map((s: any) => s.user_id))
      return connections
        .filter((c: any) => !activeIds.has(c.partner_id))
        .map((c: any) => ({ id: c.partner_id, display_name: (c.profiles as any)?.display_name ?? null }))
    },
  })

  const { data: dormantTechniques } = useQuery({
    queryKey: ['dormant-techniques', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: stale } = await supabase
        .from('technique_progress')
        .select('technique_slug, status, last_drilled_at')
        .eq('user_id', user!.id)
        .neq('status', 'unseen')
        .lt('last_drilled_at', thirtyDaysAgo)
        .order('last_drilled_at', { ascending: true })
        .limit(3)
      if (stale && stale.length >= 1) return stale
      // Also pull ones that have status but last_drilled_at is null
      const { data: nullDrilled } = await supabase
        .from('technique_progress')
        .select('technique_slug, status, last_drilled_at')
        .eq('user_id', user!.id)
        .neq('status', 'unseen')
        .is('last_drilled_at', null)
        .limit(3)
      return [...(stale ?? []), ...(nullDrilled ?? [])].slice(0, 3)
    },
  })

  // Derived values
  const now = new Date()
  const streak = useMemo(() => computeStreak(allSessionData ?? []), [allSessionData])

  const totalSessionsThisMonth = (allSessionData ?? []).filter(s => {
    const d = new Date(s.session_date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const daysUntilTournament = upcomingTournaments?.[0]
    ? Math.ceil((new Date(upcomingTournaments[0].event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // 10k tracker
  const totalMatMinutes = (allSessionData ?? []).reduce((n, s) => n + s.duration_minutes, 0)
  const totalMatHours = totalMatMinutes / 60
  const pct10k = Math.min((totalMatHours / GOAL_HOURS) * 100, 100)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const recentMins = (allSessionData ?? [])
    .filter(s => new Date(s.session_date) >= ninetyDaysAgo)
    .reduce((n, s) => n + s.duration_minutes, 0)
  const weeklyHours = recentMins / 60 / (90 / 7)
  let projectedLabel: string | null = null
  if (weeklyHours > 0 && totalMatHours < GOAL_HOURS) {
    const weeksLeft = (GOAL_HOURS - totalMatHours) / weeklyHours
    const projected = new Date(Date.now() + weeksLeft * 7 * 24 * 60 * 60 * 1000)
    projectedLabel = projected.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Training calendar (current month)
  const calendarData = useMemo(() => {
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDow = new Date(year, month, 1).getDay() // 0=Sun
    const sessionDates = new Set(
      (allSessionData ?? [])
        .filter(s => {
          const d = new Date(s.session_date)
          return d.getFullYear() === year && d.getMonth() === month
        })
        .map(s => s.session_date.slice(0, 10))
    )
    // Build padded array: nulls for empty leading slots, then 1..daysInMonth
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null)
    return { cells, sessionDates, today: now.getDate(), year, month }
  }, [allSessionData, now.getMonth()])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            {profile?.display_name ? profile.display_name : 'Overview'}
          </h1>
          <p className="text-muted text-xs font-mono tracking-wider mt-1 uppercase">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {profile?.belt_level && (
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 text-xs font-black font-mono tracking-wider ${BELT_COLORS[profile.belt_level]}`}>
              {BELT_LABELS[profile.belt_level].replace(' Belt', '').toUpperCase()}
            </div>
            {profile.stripes > 0 && (
              <div className="flex gap-0.5">
                {Array.from({ length: profile.stripes }).map((_, i) => (
                  <div key={i} className="w-1 h-4 bg-gray-100" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Injury banner */}
      {activeInjuries && activeInjuries.length > 0 && (
        <Link
          to="/injuries"
          className="flex items-center gap-3 px-4 py-3 bg-amber-900/30 border border-amber-800 text-amber-300 text-xs font-bold font-mono uppercase tracking-widest hover:bg-amber-900/40 transition-colors"
        >
          <AlertTriangle size={14} />
          <span>
            {activeInjuries.length === 1
              ? `Injury active — ${activeInjuries[0].body_part} — modify training`
              : `${activeInjuries.length} injuries active — train smart`}
          </span>
        </Link>
      )}

      {/* Partner nudge */}
      {inactivePartners && inactivePartners.length > 0 && (
        <Link
          to="/partners"
          className="flex items-center gap-3 px-4 py-3 bg-surface-2 border border-border text-muted text-xs font-mono uppercase tracking-widest hover:border-border-strong hover:text-gray-300 transition-colors"
        >
          <Users size={14} className="text-accent flex-none" />
          <span>
            {inactivePartners.length === 1
              ? `${inactivePartners[0].display_name ?? 'A partner'} hasn't trained in 2 weeks — check in`
              : `${inactivePartners.length} partners haven't trained in 2 weeks`}
          </span>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Streak — prominent first */}
        <div className={`card px-4 py-4 border-l-2 ${streak > 0 ? 'border-l-accent' : 'border-l-surface-4'}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Flame size={14} className={streak > 0 ? 'text-accent' : 'text-muted'} />
            <span className="section-header">Day Streak</span>
          </div>
          <p className="text-3xl font-black text-gray-100 font-mono leading-none">{streak}</p>
          {streak >= 7 && (
            <p className="text-[10px] font-mono text-accent uppercase tracking-wider mt-1">On fire</p>
          )}
        </div>

        <div className="card px-4 py-4 border-l-2 border-l-surface-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} className="text-accent" />
            <span className="section-header">This Month</span>
          </div>
          <p className="text-3xl font-black text-gray-100 font-mono leading-none">{totalSessionsThisMonth}</p>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mt-1">sessions</p>
        </div>

        <div className="card px-4 py-4 border-l-2 border-l-surface-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Target size={14} className="text-accent" />
            <span className="section-header">Objectives</span>
          </div>
          <p className="text-3xl font-black text-gray-100 font-mono leading-none">{activeGoals?.length ?? 0}</p>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mt-1">active</p>
        </div>

        {daysUntilTournament !== null ? (
          <div className="card px-4 py-4 border-l-2 border-l-accent">
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy size={14} className="text-accent" />
              <span className="section-header">Next Comp</span>
            </div>
            <p className="text-3xl font-black text-gray-100 font-mono leading-none">{daysUntilTournament}</p>
            <p className="text-[10px] font-mono text-muted uppercase tracking-wider mt-1">days out</p>
          </div>
        ) : (
          <div className="card px-4 py-4 border-l-2 border-l-surface-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy size={14} className="text-muted" />
              <span className="section-header">Competitions</span>
            </div>
            <p className="text-3xl font-black text-gray-100 font-mono leading-none">—</p>
            <p className="text-[10px] font-mono text-muted uppercase tracking-wider mt-1">none scheduled</p>
          </div>
        )}
      </div>

      {/* Training Calendar */}
      <div className="card px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="section-header">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs font-mono text-muted">{totalSessionsThisMonth} sessions</p>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((d, i) => (
            <p key={i} className="text-center text-[10px] font-mono text-muted uppercase tracking-wider">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarData.cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const dateStr = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasSession = calendarData.sessionDates.has(dateStr)
            const isToday = day === calendarData.today
            return (
              <div
                key={i}
                className={`aspect-square flex items-center justify-center rounded text-xs font-mono transition-colors ${
                  hasSession
                    ? 'bg-accent text-white font-bold'
                    : isToday
                    ? 'border border-accent/50 text-accent'
                    : 'text-muted'
                }`}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {/* 10,000 Hour Journey */}
      <div className="card px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-accent" />
            <p className="section-header">10,000 Hour Journey</p>
          </div>
          <p className="text-xs font-mono text-muted">
            {totalMatHours.toFixed(1)}h / {GOAL_HOURS.toLocaleString()}h
          </p>
        </div>
        <div className="w-full bg-surface-4 rounded-full h-2 mb-2">
          <div
            className="bg-accent h-2 rounded-full transition-all"
            style={{ width: `${pct10k}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-accent font-bold">{pct10k.toFixed(2)}%</span>
          {projectedLabel ? (
            <span className="text-muted">
              ~{weeklyHours.toFixed(1)} hrs/wk · projected {projectedLabel}
            </span>
          ) : (allSessionData?.length ?? 0) === 0 ? (
            <span className="text-muted">Log sessions to track your journey</span>
          ) : (
            <span className="text-muted">No recent sessions — pace unavailable</span>
          )}
        </div>
      </div>

      {/* Due for reps */}
      {dormantTechniques && dormantTechniques.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell size={14} className="text-accent" />
            <p className="section-header">Due for Reps</p>
          </div>
          <div className="space-y-2">
            {dormantTechniques.map((t: any) => {
              const daysSince = t.last_drilled_at
                ? Math.floor((Date.now() - new Date(t.last_drilled_at).getTime()) / (1000 * 60 * 60 * 24))
                : null
              return (
                <Link
                  key={t.technique_slug}
                  to="/curriculum"
                  className="card px-4 py-3 flex items-center justify-between hover:border-border-strong transition-colors group"
                >
                  <div>
                    <p className="text-sm text-gray-200 font-medium capitalize">
                      {t.technique_slug.replace(/-/g, ' ')}
                    </p>
                    <p className="text-xs text-muted capitalize mt-0.5">{t.status}</p>
                  </div>
                  <p className="text-xs font-mono text-muted group-hover:text-gray-400">
                    {daysSince !== null ? `${daysSince}d ago` : 'never drilled'}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="section-header mb-3">Quick Entry</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <QuickAction to="/training-log/new" icon={<ClipboardList size={16} />} label="Record Session" />
          <QuickAction to="/curriculum" icon={<BookOpen size={16} />} label="Technique Map" />
          <QuickAction to="/goals" icon={<Target size={16} />} label="Objectives" />
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-header">Recent Mat Time</p>
          <Link to="/training-log" className="text-xs text-accent hover:text-accent-hover font-mono uppercase tracking-wider">View all</Link>
        </div>
        {recentSessions && recentSessions.length > 0 ? (
          <div className="space-y-2">
            {recentSessions.map(session => (
              <Link
                key={session.id}
                to={`/training-log/${session.id}`}
                className="card px-4 py-3 flex items-center justify-between hover:border-border-strong transition-colors"
              >
                <div>
                  <p className="text-sm text-gray-200 font-medium">
                    {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted mt-0.5 capitalize">{session.session_type} · {session.duration_minutes}min</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-4 rounded-sm ${i < (session.energy_level ?? 0) ? 'bg-accent' : 'bg-surface-4'}`} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card py-10 flex flex-col items-center gap-3 text-center">
            <ClipboardList size={22} className="text-muted" />
            <div>
              <p className="text-gray-400 text-sm font-medium">The mat doesn't log itself.</p>
              <p className="text-muted text-xs mt-1">First session builds the habit.</p>
            </div>
            <Link to="/training-log/new" className="btn-primary text-xs">
              Record First Session
            </Link>
          </div>
        )}
      </div>

      {/* Upcoming tournaments */}
      {upcomingTournaments && upcomingTournaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-header">Upcoming Competitions</p>
            <Link to="/tournament-prep" className="text-xs text-accent hover:text-accent-hover font-mono uppercase tracking-wider">View all</Link>
          </div>
          <div className="space-y-2">
            {upcomingTournaments.map(t => {
              const days = Math.ceil((new Date(t.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <Link
                  key={t.id}
                  to={`/tournament-prep/${t.id}`}
                  className="card px-4 py-3 flex items-center justify-between hover:border-border-strong transition-colors"
                >
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{t.name}</p>
                    <p className="text-xs text-muted mt-0.5">{t.organization} · {new Date(t.event_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent text-sm font-semibold">{days}d</p>
                    <p className="text-muted text-xs">away</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="card px-4 py-3 flex items-center gap-3 hover:border-border-strong hover:bg-surface-3 transition-colors group"
    >
      <span className="text-accent">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-gray-300 font-mono group-hover:text-gray-100">{label}</span>
    </Link>
  )
}
