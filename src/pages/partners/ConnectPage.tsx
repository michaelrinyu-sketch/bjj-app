import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { useQueryClient } from '@tanstack/react-query'
import { UserPlus, Check, X } from 'lucide-react'
import { BELT_LABELS, BELT_COLORS } from '../../types/app'
import type { BeltLevel } from '../../types/app'

type Status = 'loading' | 'self' | 'already_connected' | 'pending_sent' | 'pending_received' | 'ready' | 'sent' | 'error'

export function ConnectPage() {
  const { targetUserId } = useParams<{ targetUserId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<Status>('loading')
  const [targetProfile, setTargetProfile] = useState<{
    display_name: string | null
    belt_level: string | null
    stripes: number
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !targetUserId) return

    async function check() {
      try {
        if (targetUserId === user!.id) {
          setStatus('self')
          return
        }

        // Fetch target profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, belt_level, stripes')
          .eq('id', targetUserId)
          .single()

        if (!profile) {
          setStatus('error')
          setErrorMsg('User not found.')
          return
        }

        setTargetProfile(profile)

        // Check existing connection
        const { data: conn } = await supabase
          .from('partner_connections')
          .select('id')
          .eq('user_id', user!.id)
          .eq('partner_id', targetUserId)
          .maybeSingle()

        if (conn) {
          setStatus('already_connected')
          return
        }

        // Check existing requests (either direction)
        const { data: requests } = await supabase
          .from('partner_requests')
          .select('id, from_user_id, to_user_id, status')
          .or(`and(from_user_id.eq.${user!.id},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${user!.id})`)
          .eq('status', 'pending')

        if (requests && requests.length > 0) {
          const req = requests[0]
          if (req.from_user_id === user!.id) {
            setStatus('pending_sent')
          } else {
            setStatus('pending_received')
          }
          return
        }

        setStatus('ready')
      } catch (e) {
        setStatus('error')
        setErrorMsg('Something went wrong.')
      }
    }

    check()
  }, [user, targetUserId])

  const handleSendRequest = async () => {
    if (!user || !targetUserId) return
    const { error } = await supabase.from('partner_requests').insert({
      from_user_id: user.id,
      to_user_id: targetUserId,
    })
    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      queryClient.invalidateQueries({ queryKey: ['partner-requests-outgoing'] })
      setStatus('sent')
    }
  }

  const handleAccept = async () => {
    if (!user || !targetUserId) return
    // Find the incoming request
    const { data: req } = await supabase
      .from('partner_requests')
      .select('id')
      .eq('from_user_id', targetUserId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (!req) return
    await supabase.rpc('accept_partner_request', { request_id: req.id })
    queryClient.invalidateQueries({ queryKey: ['partner-connections'] })
    queryClient.invalidateQueries({ queryKey: ['partner-requests-incoming'] })
    navigate('/partners')
  }

  const belt = targetProfile?.belt_level as BeltLevel | null

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="w-10 h-10 border border-accent flex items-center justify-center mx-auto mb-3">
            <span className="text-accent font-black text-sm font-mono">▲</span>
          </div>
          <p className="text-gray-100 font-black text-xs font-mono tracking-[0.3em] uppercase">TAP TRACKER</p>
        </div>

        {status === 'loading' && (
          <div className="card p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {status === 'self' && (
          <div className="card p-6 text-center space-y-3">
            <p className="text-gray-200 font-semibold">That's your own QR code.</p>
            <p className="text-muted text-sm">Share it with your training partners to connect.</p>
            <button onClick={() => navigate('/partners')} className="btn-primary w-full justify-center">
              Go to Partners
            </button>
          </div>
        )}

        {(status === 'ready' || status === 'sent') && targetProfile && (
          <div className="card p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-surface-3 border border-border flex items-center justify-center mx-auto mb-3">
                <UserPlus size={20} className="text-accent" />
              </div>
              <p className="text-gray-100 font-bold text-lg">
                {targetProfile.display_name ?? 'Unknown Athlete'}
              </p>
              {belt && (
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-bold font-mono ${BELT_COLORS[belt]}`}>
                    {BELT_LABELS[belt].replace(' Belt', '').toUpperCase()}
                  </span>
                  {targetProfile.stripes > 0 && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: targetProfile.stripes }).map((_, i) => (
                        <div key={i} className="w-1 h-3.5 bg-gray-100" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {status === 'sent' ? (
              <div className="flex items-center justify-center gap-2 text-green-400 py-2">
                <Check size={16} />
                <span className="text-sm font-medium">Request sent!</span>
              </div>
            ) : (
              <button onClick={handleSendRequest} className="btn-primary w-full justify-center">
                <UserPlus size={14} />
                Send Partner Request
              </button>
            )}

            <button
              onClick={() => navigate('/partners')}
              className="btn-secondary w-full justify-center text-xs"
            >
              Go to Partners
            </button>
          </div>
        )}

        {status === 'already_connected' && targetProfile && (
          <div className="card p-6 space-y-4 text-center">
            <Check size={24} className="text-green-400 mx-auto" />
            <div>
              <p className="text-gray-100 font-bold">Already connected</p>
              <p className="text-muted text-sm mt-1">
                You and {targetProfile.display_name ?? 'this athlete'} are already training partners.
              </p>
            </div>
            <button onClick={() => navigate('/partners')} className="btn-primary w-full justify-center">
              View Partners
            </button>
          </div>
        )}

        {status === 'pending_sent' && (
          <div className="card p-6 space-y-4 text-center">
            <p className="text-gray-200 font-semibold">Request already sent</p>
            <p className="text-muted text-sm">Waiting for {targetProfile?.display_name ?? 'them'} to accept.</p>
            <button onClick={() => navigate('/partners')} className="btn-secondary w-full justify-center">
              Back to Partners
            </button>
          </div>
        )}

        {status === 'pending_received' && targetProfile && (
          <div className="card p-6 space-y-4">
            <div className="text-center">
              <p className="text-gray-100 font-bold">
                {targetProfile.display_name ?? 'This athlete'} wants to connect
              </p>
              <p className="text-muted text-sm mt-1">Accept their partner request?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/partners')}
                className="btn-secondary flex-1 justify-center"
              >
                <X size={14} />
                Later
              </button>
              <button onClick={handleAccept} className="btn-primary flex-1 justify-center">
                <Check size={14} />
                Accept
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="card p-6 space-y-4 text-center">
            <p className="text-red-400 font-semibold">{errorMsg ?? 'Something went wrong.'}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full justify-center">
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
