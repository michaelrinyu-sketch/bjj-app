import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, BookOpen, Users, Settings } from 'lucide-react'

const ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Overview' },
  { to: '/training-log', icon: ClipboardList,   label: 'Mat Log'  },
  { to: '/curriculum',   icon: BookOpen,        label: 'Technique' },
  { to: '/partners',     icon: Users,           label: 'Partners'  },
  { to: '/settings',     icon: Settings,        label: 'Settings'  },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-1 border-t border-border flex md:hidden">
      {ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              isActive ? 'text-accent' : 'text-muted'
            }`
          }
        >
          <Icon size={20} />
          <span className="text-[9px] font-mono uppercase tracking-wider leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
