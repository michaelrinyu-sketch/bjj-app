import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  Video,
  ClipboardList,
  Trophy,
  AlertTriangle,
  Target,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BELT_COLORS, BELT_LABELS } from '../../types/app'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/curriculum', icon: BookOpen, label: 'Technique Map' },
  { to: '/videos', icon: Video, label: 'Footage' },
  { to: '/training-log', icon: ClipboardList, label: 'Mat Log' },
  { to: '/tournament-prep', icon: Trophy, label: 'Competition Prep' },
  { to: '/injuries', icon: AlertTriangle, label: 'Injury Log' },
  { to: '/goals', icon: Target, label: 'Objectives' },
  { to: '/partners', icon: Users, label: 'Partners' },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()

  const belt = profile?.belt_level
  const stripes = profile?.stripes ?? 0

  return (
    <aside className="w-56 flex-none bg-surface-1 border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-accent flex items-center justify-center flex-none">
            <span className="text-accent font-black text-[10px] font-mono leading-none">▲</span>
          </div>
          <div>
            <p className="text-gray-100 font-black text-xs font-mono tracking-[0.3em] leading-none">TAP TRACKER</p>
            <p className="text-muted text-[9px] font-mono tracking-[0.2em] mt-0.5">BJJ COMPANION</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors group border-l-2 font-mono ${
                isActive
                  ? 'border-accent bg-surface-2 text-gray-100'
                  : 'border-transparent text-muted hover:text-gray-300 hover:bg-surface-2'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={14} className={isActive ? 'text-accent flex-none' : 'text-muted group-hover:text-gray-400 flex-none'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Rank display */}
      {belt && (
        <div className="px-4 py-3 border-t border-border">
          <p className="section-header mb-2">Rank</p>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 text-xs font-bold font-mono ${BELT_COLORS[belt]}`}>
              {BELT_LABELS[belt].replace(' Belt', '').toUpperCase()}
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-3.5 ${i < stripes ? 'bg-gray-100' : 'bg-surface-4'}`}
                />
              ))}
            </div>
          </div>
          {profile?.display_name && (
            <p className="text-muted text-[10px] font-mono tracking-wider mt-1.5 uppercase">{profile.display_name}</p>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="px-2 pb-3 space-y-px border-t border-border pt-2">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider font-mono text-muted hover:text-gray-300 hover:bg-surface-2 transition-colors border-l-2 border-transparent"
        >
          <Settings size={14} />
          Settings
        </NavLink>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider font-mono text-muted hover:text-gray-300 hover:bg-surface-2 transition-colors border-l-2 border-transparent"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
