import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { BELT_LABELS, BELT_COLORS } from '../../types/app'
import type { BeltLevel } from '../../types/app'
import { QRCodeSVG } from 'qrcode.react'
import {
  Users, Search, QrCode, Check, X, Clock, Flame,
  UserPlus, UserMinus, Send, Inbox, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── helpers ──────────────────────────────────────────────────────────────────

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const unique = [...new Set(dates)].sort().reverse()
  const today = new Date()
  let streak = 0
  let cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)

  for (const d of unique) {
    const sessionDate = new Date(d)
    sessionDate.setHours(0, 0, 0, 0)
    const diff = Math.round((cursor.getTime() - sessionDate.getTime()) / 86400000)
    if (diff === 0 || (streak === 0 && diff === 1)) {
      streak++
      cursor = sessionDate
    } else if (diff === 1) {
      streak++
      cursor = sessionDate
    } else {
      break
    }
  }
  return streak
}

// ─── PartnersPage ─────────────────────────────────────────────────────────────

export function PartnersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [requestsOpen, setRequestsOpen] = useState(true)
  const qrUrl = `${window.location.origin}/connect/${user?.id}`

  // ── queries ────────────────────────────────────────────────

  const { data: connections } = useQuery({
    queryKey: ['partner-connections', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_connections')
        .select('partner_id, created_at')
        .eq('user_id', user!.id)
      return (data ?? []) as { partner_id: string; created_at: string }[]
    },
  })

  const partnerIds = useMemo(() => connections?.map(c => c.partner_id) ?? [], [connections])

  const { data: partnerProfiles } = useQuery({
    queryKey: ['partner-profiles', partnerIds],
    enabled: partnerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, belt_level, stripes')
        .in('id', partnerIds)
      return (data ?? []) as { id: string; display_name: string | null; belt_level: string | null; stripes: number }[]
    },
  })

  const { data: partnerSessions } = useQuery({
    queryKey: ['partner-sessions', partnerIds],
    enabled: partnerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('user_id, session_date, duration_minutes')
        .in('user_id', partnerIds)
      return (data ?? []) as { user_id: string; session_date: string; duration_minutes: number }[]
    },
  })

  const { data: incomingRequests } = useQuery({
    queryKey: ['partner-requests-in', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_requests')
        .select('id, from_user_id, status, created_at')
        .eq('to_user_id', user!.id)
        .eq('status', 'pending')
      if (!data?.length) return []
      const ids = data.map(r => r.from_user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, belt_level, stripes')
        .in('id', ids)
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
      return data.map(r => ({ ...r, from_profile: profileMap[r.from_user_id] }))
    },
  })

  const { data: outgoingRequests } = useQuery({
    queryKey: ['partner-requests-out', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_requests')
        .select('id, to_user_id, status, created_at')
        .eq('from_user_id', user!.id)
        .eq('status', 'pending')
      if (!data?.length) return []
      const ids = data.map(r => r.to_user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, belt_level, stripes')
        .in('id', ids)
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
      return data.map(r => ({ ...r, to_profile: profileMap[r.to_user_id] }))
    },
  })

  const { data: searchResults } = useQuery({
    queryKey: ['profile-search', searchQuery],
    enabled: searchQuery.trim().length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, belt_level, stripes')
        .ilike('display_name', `%${searchQuery.trim()}%`)
        .neq('id', user!.id)
        .limit(10)
      return (data ?? []) as { id: string; display_name: string | null; belt_level: string | null; stripes: number }[]
    },
  })

  // ── partner feed data ──────────────────────────────────────

  const partnerFeed = useMemo(() => {
    if (!partnerProfiles || !partnerSessions) return []
    return partnerProfiles.map(profile => {
      const sessions = partnerSessions.filter(s => s.user_id === profile.id)
      const totalHours = sessions.reduce((n, s) => n + s.duration_minutes, 0) / 60
      const streak = computeStreak(sessions.map(s => s.session_date))
      const lastDate = sessions.length
        ? sessions.map(s => s.session_date).sort().at(-1)!
        : null
      const daysSince = lastDate
        ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
        : null
      return { profile, totalHours, streak, lastDate, daysSince }
    })
  }, [partnerProfiles, partnerSessions])

  // ── actions ────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['partner-connections'] })
    queryClient.invalidateQueries({ queryKey: ['partner-requests-in'] })
    queryClient.invalidateQueries({ queryKey: ['partner-requests-out'] })
    queryClient.invalidateQueries({ queryKey: ['partner-profiles'] })
    queryClient.invalidateQueries({ queryKey: ['partner-sessions'] })
    queryClient.invalidateQueries({ queryKey: ['partner-nudge'] })
  }

  const sendRequest = async (toUserId: string) => {
    await supabase.from('partner_requests').insert({
      from_user_id: user!.id,
      to_user_id: toUserId,
    })
    invalidate()
  }

  const acceptRequest = async (requestId: string) => {
    await supabase.rpc('accept_partner_request', { request_id: requestId })
    invalidate()
  }

  const declineRequest = async (requestId: string) => {
    await supabase
      .from('partner_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)
      .eq('to_user_id', user!.id)
    invalidate()
  }

  const withdrawRequest = async (requestId: string) => {
    await supabase
      .from('partner_requests')
      .delete()
      .eq('id', requestId)
      .eq('from_user_id', user!.id)
    invalidate()
  }

  const disconnect = async (partnerId: string) => {
    await supabase.rpc('disconnect_partner', { target_partner_id: partnerId })
    invalidate()
  }

  // ── computed states for search results ────────────────────

  const outgoingIds = new Set(outgoingRequests?.map(r => r.to_user_id) ?? [])
  const pendingRequests = (incomingRequests?.length ?? 0) + (outgoingRequests?.length ?? 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Training Partners</h1>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mt-1">
            {connections?.length ?? 0} connected
          </p>
        </div>
        <button onClick={() => setShowQR(true)} className="btn-secondary">
          <QrCode size={14} />
          My QR Code
        </button>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by display name…"
            className="input pl-8"
          />
        </div>
        {searchQuery.trim().length >= 2 && (
          <div className="card overflow-hidden divide-y divide-border">
            {!searchResults || searchResults.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No users found</p>
            ) : (
              searchResults.map(p => {
                const isConnected = partnerIds.includes(p.id)
                const isPending = outgoingIds.has(p.id)
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200">{p.display_name ?? 'Unnamed'}</p>
                      {p.belt_level && (
                        <span className={`text-xs px-1.5 py-0.5 font-mono font-bold ${BELT_COLORS[p.belt_level as BeltLevel]}`}>
                          {BELT_LABELS[p.belt_level as BeltLevel].replace(' Belt', '').toUpperCase()}
                        </span>
                      )}
                    </div>
                    {isConnected ? (
                      <span className="text-xs text-green-400 font-mono">Connected</span>
                    ) : isPending ? (
                      <span className="text-xs text-muted font-mono">Pending</span>
                    ) : (
                      <button onClick={() => sendRequest(p.id)} className="btn-secondary py-1 px-2.5 text-xs">
                        <UserPlus size={12} />
                        Connect
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {pendingRequests > 0 && (
        <div className="card overflow-hidden border border-accent/20">
          <button
            onClick={() => setRequestsOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-3 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Inbox size={14} className="text-accent" />
              <span className="text-sm font-semibold text-gray-200">Pending Requests</span>
              <span className="text-xs bg-accent text-white font-mono px-1.5 py-0.5 rounded-full">{pendingRequests}</span>
            </div>
            {requestsOpen ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
          </button>

          {requestsOpen && (
            <div className="border-t border-border divide-y divide-border">
              {/* Incoming */}
              {(incomingRequests ?? []).map(req => (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-none">
                    <Inbox size={13} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{(req as any).from_profile?.display_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted">Wants to connect</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(req.id)} className="btn-primary py-1 px-2.5 text-xs">
                      <Check size={11} />
                      Accept
                    </button>
                    <button onClick={() => declineRequest(req.id)} className="btn-secondary py-1 px-2.5 text-xs">
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {/* Outgoing */}
              {(outgoingRequests ?? []).map(req => (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-none">
                    <Send size={13} className="text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{(req as any).to_profile?.display_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted">Request sent · pending</p>
                  </div>
                  <button onClick={() => withdrawRequest(req.id)} className="text-muted hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partner feed */}
      {partnerFeed.length === 0 ? (
        <div className="card py-12 flex flex-col items-center gap-3">
          <Users size={24} className="text-muted" />
          <p className="text-muted text-sm text-center">
            No connected partners yet.<br />Search by name or share your QR code to connect.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="section-header">Connected Partners</p>
          {partnerFeed.map(({ profile, totalHours, streak, daysSince }) => (
            <div key={profile.id} className="card px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-200">{profile.display_name ?? 'Unnamed'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {profile.belt_level && (
                      <span className={`text-xs px-1.5 py-0.5 font-mono font-bold ${BELT_COLORS[profile.belt_level as BeltLevel]}`}>
                        {BELT_LABELS[profile.belt_level as BeltLevel].replace(' Belt', '').toUpperCase()}
                      </span>
                    )}
                    {profile.stripes > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: profile.stripes }).map((_, i) => (
                          <div key={i} className="w-1 h-3 bg-gray-100" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => disconnect(profile.id)}
                  className="text-muted hover:text-red-400 transition-colors flex-none"
                  title="Disconnect"
                >
                  <UserMinus size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock size={11} className="text-accent" />
                  </div>
                  <p className="text-base font-black font-mono text-gray-100">{totalHours.toFixed(0)}</p>
                  <p className="text-xs text-muted">mat hours</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame size={11} className="text-orange-400" />
                  </div>
                  <p className="text-base font-black font-mono text-gray-100">{streak}</p>
                  <p className="text-xs text-muted">day streak</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-black font-mono text-gray-100">
                    {daysSince === null ? '—' : daysSince === 0 ? 'Today' : `${daysSince}d`}
                  </p>
                  <p className="text-xs text-muted">last session</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={() => setShowQR(false)}
        >
          <div className="card p-6 flex flex-col items-center gap-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-200">My Connect QR</p>
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG value={qrUrl} size={200} />
            </div>
            <p className="text-xs text-muted text-center">
              Point a phone camera at this to send you a connection request
            </p>
            <button onClick={() => setShowQR(false)} className="btn-secondary w-full justify-center">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
