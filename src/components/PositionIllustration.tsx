/**
 * Clean SVG silhouette illustrations for BJJ position categories.
 * Two-figure compositions: secondary figure in BODY color, primary/active in ACCENT.
 * All at viewBox="0 0 80 56".
 */
import type { ReactElement } from 'react'

const B = '#374151' // secondary figure (gray)
const A = '#dc2626' // primary/active figure (red accent)

// ── Individual SVG illustrations ──────────────────────────────────────────────

function GuardSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom player: head left, body center, hips raised, legs wrapping */}
      <circle cx="8" cy="40" r="4" fill={B}/>
      <ellipse cx="24" cy="40" rx="14" ry="5" fill={B}/>
      <ellipse cx="39" cy="36" rx="7" ry="5" fill={B} transform="rotate(-20 39 36)"/>
      {/* Legs curving up and around top player */}
      <path d="M45 30 Q55 18 64 22" stroke={B} strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M45 42 Q55 50 64 44" stroke={B} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Top player: posturing inside guard */}
      <circle cx="65" cy="13" r="4" fill={A}/>
      <ellipse cx="65" cy="30" rx="5" ry="9" fill={A}/>
    </svg>
  )
}

function GuardPassingSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom player: on back, legs elevated and being pushed aside */}
      <circle cx="8" cy="44" r="4" fill={B}/>
      <ellipse cx="26" cy="44" rx="16" ry="5" fill={B}/>
      <path d="M42 38 L58 24" stroke={B} strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M42 48 L60 44" stroke={B} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Top player: driving through the guard */}
      <circle cx="69" cy="13" r="4" fill={A}/>
      <ellipse cx="66" cy="29" rx="6" ry="12" fill={A} transform="rotate(-15 66 29)"/>
      <path d="M60 25 L50 34" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function MountSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom player: flat on back */}
      <circle cx="8" cy="46" r="4" fill={B}/>
      <ellipse cx="42" cy="46" rx="30" ry="5" fill={B}/>
      {/* Top player: sitting upright in mount */}
      <circle cx="38" cy="13" r="4" fill={A}/>
      <ellipse cx="38" cy="27" rx="8" ry="10" fill={A}/>
      {/* Legs straddling down */}
      <path d="M30 34 L22 44" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M46 34 L56 44" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function BackControlSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Front player: seated, slightly hunched */}
      <circle cx="28" cy="18" r="4" fill={B}/>
      <ellipse cx="32" cy="32" rx="7" ry="12" fill={B} transform="rotate(8 32 32)"/>
      <path d="M28 42 L22 52" stroke={B} strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M36 42 L36 52" stroke={B} strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Back player: behind with hooks, arms reaching around */}
      <circle cx="52" cy="14" r="4" fill={A}/>
      <ellipse cx="50" cy="28" rx="7" ry="11" fill={A} transform="rotate(-8 50 28)"/>
      {/* Choking arm reaching around front player's neck */}
      <path d="M44 22 C38 20 30 22 28 28" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Body lock arm */}
      <path d="M56 30 C62 32 62 42 54 44" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Hooks (legs in front player's hips) */}
      <path d="M44 38 L34 46" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M54 40 L44 50" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function SideControlSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom player: flat on back */}
      <circle cx="8" cy="46" r="4" fill={B}/>
      <ellipse cx="42" cy="46" rx="30" ry="5" fill={B}/>
      {/* Top player: perpendicular, chest to chest */}
      <circle cx="24" cy="12" r="4" fill={A}/>
      <ellipse cx="24" cy="29" rx="6" ry="14" fill={A}/>
      {/* Near arm underhooking */}
      <path d="M18 30 L10 40" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Far arm controlling head */}
      <path d="M30 24 L38 30" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function TakedownsSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Defender: standing */}
      <circle cx="62" cy="8" r="4" fill={B}/>
      <ellipse cx="62" cy="22" rx="6" ry="11" fill={B}/>
      <path d="M58 31 L54 50" stroke={B} strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M66 31 L70 50" stroke={B} strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Attacker: shooting double-leg */}
      <circle cx="16" cy="12" r="4" fill={A}/>
      <ellipse cx="28" cy="26" rx="13" ry="7" fill={A} transform="rotate(-22 28 26)"/>
      {/* Lead leg driving */}
      <path d="M38 20 L52 30" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Trailing leg */}
      <path d="M18 28 L24 46" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Arms wrapping legs */}
      <path d="M38 24 C46 30 50 36 50 42" stroke={A} strokeWidth="4" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function SubmissionsSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Triangle choke composition */}
      {/* Bottom player: on back, legs forming triangle */}
      <circle cx="8" cy="38" r="4" fill={A}/>
      <ellipse cx="22" cy="38" rx="12" ry="5" fill={A}/>
      {/* Legs forming triangle around neck/shoulder */}
      <path d="M34 32 Q44 16 62 22" stroke={A} strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M34 44 Q48 52 62 44" stroke={A} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Line closing triangle (knee to ankle) */}
      <path d="M62 22 C68 30 68 38 62 44" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Top player: head dipped, arm trapped */}
      <circle cx="62" cy="13" r="4" fill={B}/>
      <ellipse cx="60" cy="27" rx="5" ry="8" fill={B}/>
      {/* Trapped arm extended */}
      <path d="M56 24 L42 30" stroke={B} strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function LegLocksSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Ashi garami (leg entanglement) */}
      {/* Player 1: leaning back, attacking the leg */}
      <circle cx="64" cy="9" r="4" fill={A}/>
      <ellipse cx="54" cy="21" rx="12" ry="6" fill={A} transform="rotate(18 54 21)"/>
      {/* Attacking leg wrapping (near leg of ashi) */}
      <path d="M44 28 Q38 34 40 44" stroke={A} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Heel hook arm grabbing foot */}
      <path d="M60 18 C68 24 72 34 66 44" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Player 2: on back, leg being attacked */}
      <circle cx="12" cy="34" r="4" fill={B}/>
      <ellipse cx="26" cy="42" rx="12" ry="5" fill={B}/>
      {/* Attacked leg going into ashi */}
      <path d="M38 40 L48 32" stroke={B} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Far leg */}
      <path d="M38 46 L30 54" stroke={B} strokeWidth="6" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function FundamentalsSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Single figure performing hip escape (shrimp) */}
      <circle cx="12" cy="16" r="4.5" fill={A}/>
      {/* Spine curve in motion */}
      <path d="M16 18 C26 22 32 18 40 26 C48 34 46 44 54 46"
        stroke={A} strokeWidth="9" strokeLinecap="round" fill="none"/>
      {/* Pushing leg */}
      <path d="M54 46 L70 38" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Front escaping leg */}
      <path d="M34 28 L22 42" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Motion arrow */}
      <path d="M60 18 L72 18" stroke={B} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M68 14 L72 18 L68 22" stroke={B} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function HalfGuardSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom player: one leg free, one leg trapping top's leg */}
      <circle cx="8" cy="40" r="4" fill={B}/>
      <ellipse cx="24" cy="40" rx="14" ry="5" fill={B}/>
      {/* Free leg raised */}
      <path d="M38 34 Q50 20 62 24" stroke={B} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Trapping legs (lockdown / half guard on one leg) */}
      <path d="M38 45 Q50 50 58 47" stroke={B} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Top player: pressing, one leg trapped */}
      <circle cx="64" cy="13" r="4" fill={A}/>
      <ellipse cx="62" cy="28" rx="5" ry="11" fill={A}/>
      {/* Trapped leg inside half guard */}
      <path d="M62 38 L54 48" stroke={A} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Free leg */}
      <path d="M66 38 L72 50" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function RubberGuardSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom player (red): high guard, leg behind neck (mission control) */}
      <circle cx="8" cy="36" r="4" fill={A}/>
      <ellipse cx="22" cy="36" rx="12" ry="5" fill={A}/>
      {/* High guard leg sweeping up behind opponent's neck */}
      <path d="M34 28 C44 12 60 10 66 18" stroke={A} strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Lower guard leg */}
      <path d="M34 44 C46 52 58 48 64 44" stroke={A} strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Overhook arm (mission control) */}
      <path d="M26 32 C36 22 50 20 56 22" stroke={A} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* Top player (gray): stuck, head down */}
      <circle cx="65" cy="13" r="4" fill={B}/>
      <ellipse cx="63" cy="27" rx="5" ry="9" fill={B}/>
    </svg>
  )
}

function SelfDefenseSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Attacker: throwing punch */}
      <circle cx="18" cy="10" r="4" fill={B}/>
      <ellipse cx="18" cy="24" rx="6" ry="11" fill={B}/>
      <path d="M24 20 L42 26" stroke={B} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M14 32 L10 48" stroke={B} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M22 32 L22 48" stroke={B} strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Defender: deflecting, in base */}
      <circle cx="60" cy="10" r="4" fill={A}/>
      <ellipse cx="60" cy="24" rx="6" ry="11" fill={A}/>
      {/* Parrying arm */}
      <path d="M54 18 L44 24" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Guard hand */}
      <path d="M66 18 L72 12" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M56 32 L50 48" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M64 32 L68 48" stroke={A} strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function DefaultSVG() {
  return (
    <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      {/* Generic grappling position — two figures entangled */}
      <circle cx="22" cy="20" r="4.5" fill={B}/>
      <ellipse cx="34" cy="34" rx="14" ry="8" fill={B} transform="rotate(-15 34 34)"/>
      <circle cx="56" cy="22" r="4.5" fill={A}/>
      <ellipse cx="46" cy="34" rx="13" ry="7" fill={A} transform="rotate(12 46 34)"/>
      <path d="M42 28 C36 24 30 28 28 34" stroke={A} strokeWidth="4" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ── Category → illustration mapping ──────────────────────────────────────────

type IllustrationKey =
  | 'guard' | 'guard-passing' | 'mount' | 'back-control'
  | 'side-control' | 'takedowns' | 'submissions' | 'leg-locks'
  | 'fundamentals' | 'rubber-guard' | 'half-guard' | 'self-defense'
  | 'default'

const CATEGORY_TO_KEY: Record<string, IllustrationKey> = {
  'Fundamentals': 'fundamentals',
  'Guard': 'guard',
  'Guard Passing': 'guard-passing',
  'Mount': 'mount',
  'Back Control': 'back-control',
  'Side Control': 'side-control',
  'Takedowns': 'takedowns',
  'Submissions': 'submissions',
  'Leg Locks': 'leg-locks',
  'Half Guard': 'half-guard',
  'Rubber Guard': 'rubber-guard',
  'Self-Defense': 'self-defense',
  // Gracie Barra mapped levels
  'GB1 Fundamentals': 'fundamentals',
  'GB1 Guard': 'guard',
  'GB1 Passing': 'guard-passing',
  'GB1 Positions': 'mount',
  'GB1 Submissions': 'submissions',
  'GB1 Sweeps': 'guard',
  'GB1 Takedowns': 'takedowns',
  'GB1 Escapes': 'side-control',
  'GB2 Guard': 'guard',
  'GB2 Passing': 'guard-passing',
  'GB2 Attacks': 'submissions',
  'GB2 Submissions': 'submissions',
  'GB2 Takedowns': 'takedowns',
  'GB3 Guard': 'guard',
  'GB3 Passing': 'guard-passing',
  'GB3 Leg Locks': 'leg-locks',
  // 10th Planet
  'Lockdown': 'half-guard',
  '50/50 Guard & Entries': 'leg-locks',
  '50/50': 'leg-locks',
  'Twister System': 'back-control',
  // Gracie Combatives
  'Positional Control (Mount)': 'mount',
  'Guard Restoration': 'guard',
}

const ILLUSTRATION_MAP: Record<IllustrationKey, () => ReactElement> = {
  'guard': GuardSVG,
  'guard-passing': GuardPassingSVG,
  'mount': MountSVG,
  'back-control': BackControlSVG,
  'side-control': SideControlSVG,
  'takedowns': TakedownsSVG,
  'submissions': SubmissionsSVG,
  'leg-locks': LegLocksSVG,
  'fundamentals': FundamentalsSVG,
  'half-guard': HalfGuardSVG,
  'rubber-guard': RubberGuardSVG,
  'self-defense': SelfDefenseSVG,
  'default': DefaultSVG,
}

// ── Public component ──────────────────────────────────────────────────────────

interface PositionIllustrationProps {
  category: string
  /** 'sm' = 40×28, 'md' = 64×44, 'lg' = 96×67 */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_DIMS = {
  sm: { width: 40, height: 28 },
  md: { width: 64, height: 44 },
  lg: { width: 96, height: 67 },
}

export function PositionIllustration({ category, size = 'md', className = '' }: PositionIllustrationProps) {
  const key = CATEGORY_TO_KEY[category] ?? 'default'
  const SVGComponent = ILLUSTRATION_MAP[key]
  const { width, height } = SIZE_DIMS[size]

  return (
    <div
      className={`flex-none bg-surface-1 rounded overflow-hidden opacity-80 ${className}`}
      style={{ width, height }}
    >
      <SVGComponent />
    </div>
  )
}
