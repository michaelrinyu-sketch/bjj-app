import type { BeltLevel } from '../../types/app'

export interface Technique {
  slug: string
  name: string
  belt: BeltLevel
  category: string
  subcategory: string
  description?: string
}

export const traditionalCurriculum: Technique[] = [
  // ─── WHITE BELT ─────────────────────────────────────────────────────────────
  // Fundamentals
  { slug: 'trad-w-breakfall-back', name: 'Back Breakfall', belt: 'white', category: 'Fundamentals', subcategory: 'Breakfalls' },
  { slug: 'trad-w-breakfall-side', name: 'Side Breakfall', belt: 'white', category: 'Fundamentals', subcategory: 'Breakfalls' },
  { slug: 'trad-w-shrimp', name: 'Hip Escape (Shrimp)', belt: 'white', category: 'Fundamentals', subcategory: 'Movement' },
  { slug: 'trad-w-bridge', name: 'Bridge (Upa)', belt: 'white', category: 'Fundamentals', subcategory: 'Movement' },
  { slug: 'trad-w-technical-standup', name: 'Technical Standup', belt: 'white', category: 'Fundamentals', subcategory: 'Movement' },
  { slug: 'trad-w-granby-roll', name: 'Granby Roll', belt: 'white', category: 'Fundamentals', subcategory: 'Movement' },
  // Guard
  { slug: 'trad-w-closed-guard-posture', name: 'Closed Guard Posture Control', belt: 'white', category: 'Guard', subcategory: 'Closed Guard' },
  { slug: 'trad-w-armbar-guard', name: 'Armbar from Closed Guard', belt: 'white', category: 'Guard', subcategory: 'Closed Guard' },
  { slug: 'trad-w-triangle-guard', name: 'Triangle Choke from Guard', belt: 'white', category: 'Guard', subcategory: 'Closed Guard' },
  { slug: 'trad-w-kimura-guard', name: 'Kimura from Guard', belt: 'white', category: 'Guard', subcategory: 'Closed Guard' },
  { slug: 'trad-w-guillotine', name: 'Guillotine Choke', belt: 'white', category: 'Guard', subcategory: 'Closed Guard' },
  { slug: 'trad-w-hip-bump-sweep', name: 'Hip Bump Sweep', belt: 'white', category: 'Guard', subcategory: 'Closed Guard Sweeps' },
  { slug: 'trad-w-scissor-sweep', name: 'Scissor Sweep', belt: 'white', category: 'Guard', subcategory: 'Closed Guard Sweeps' },
  // Guard Passing
  { slug: 'trad-w-torreando-pass', name: 'Torreando Pass', belt: 'white', category: 'Guard Passing', subcategory: 'Open Guard Passes' },
  { slug: 'trad-w-double-under-pass', name: 'Double Under Pass', belt: 'white', category: 'Guard Passing', subcategory: 'Closed Guard Passes' },
  { slug: 'trad-w-knee-slice-pass', name: 'Knee Slice Pass', belt: 'white', category: 'Guard Passing', subcategory: 'Open Guard Passes' },
  // Mount
  { slug: 'trad-w-mount-armbar', name: 'Armbar from Mount', belt: 'white', category: 'Mount', subcategory: 'Mount Attacks' },
  { slug: 'trad-w-rnc-from-mount', name: 'Rear Naked Choke Setup from Mount', belt: 'white', category: 'Mount', subcategory: 'Mount Attacks' },
  { slug: 'trad-w-mount-escape-upa', name: 'Mount Escape — Upa (Bridge & Roll)', belt: 'white', category: 'Mount', subcategory: 'Mount Escapes' },
  { slug: 'trad-w-mount-escape-elbow-knee', name: 'Mount Escape — Elbow-Knee', belt: 'white', category: 'Mount', subcategory: 'Mount Escapes' },
  // Back
  { slug: 'trad-w-rnc', name: 'Rear Naked Choke', belt: 'white', category: 'Back Control', subcategory: 'Back Attacks' },
  { slug: 'trad-w-back-escape-roll', name: 'Back Escape — Roll to Guard', belt: 'white', category: 'Back Control', subcategory: 'Back Escapes' },
  // Side Control
  { slug: 'trad-w-side-control-maintain', name: 'Side Control Maintenance', belt: 'white', category: 'Side Control', subcategory: 'Side Control Pins' },
  { slug: 'trad-w-side-control-escape-shrimp', name: 'Side Control Escape — Shrimp to Guard', belt: 'white', category: 'Side Control', subcategory: 'Side Control Escapes' },
  { slug: 'trad-w-americana-from-side', name: 'Americana from Side Control', belt: 'white', category: 'Side Control', subcategory: 'Side Control Attacks' },
  // Takedowns
  { slug: 'trad-w-double-leg', name: 'Double Leg Takedown', belt: 'white', category: 'Takedowns', subcategory: 'Wrestling' },
  { slug: 'trad-w-single-leg', name: 'Single Leg Takedown', belt: 'white', category: 'Takedowns', subcategory: 'Wrestling' },
  { slug: 'trad-w-osoto-gari', name: 'O-Soto Gari', belt: 'white', category: 'Takedowns', subcategory: 'Judo' },
  { slug: 'trad-w-clinch-control', name: 'Clinch Control', belt: 'white', category: 'Takedowns', subcategory: 'Clinch' },

  // ─── BLUE BELT ──────────────────────────────────────────────────────────────
  // Guard
  { slug: 'trad-b-butterfly-guard', name: 'Butterfly Guard Frame & Control', belt: 'blue', category: 'Guard', subcategory: 'Butterfly Guard' },
  { slug: 'trad-b-butterfly-sweep', name: 'Butterfly Sweep', belt: 'blue', category: 'Guard', subcategory: 'Butterfly Guard' },
  { slug: 'trad-b-half-guard-lockdown', name: 'Half Guard — Lockdown', belt: 'blue', category: 'Guard', subcategory: 'Half Guard' },
  { slug: 'trad-b-half-guard-sweep', name: 'Half Guard Sweep (Rollover)', belt: 'blue', category: 'Guard', subcategory: 'Half Guard' },
  { slug: 'trad-b-spider-guard', name: 'Spider Guard Frame & Lasso', belt: 'blue', category: 'Guard', subcategory: 'Spider Guard' },
  { slug: 'trad-b-de-la-riva', name: 'De La Riva Hook & Sweeps', belt: 'blue', category: 'Guard', subcategory: 'De La Riva' },
  { slug: 'trad-b-omoplata', name: 'Omoplata', belt: 'blue', category: 'Guard', subcategory: 'Guard Submissions' },
  // Guard Passing
  { slug: 'trad-b-headquarters-pass', name: 'Headquarters / Stack Pass', belt: 'blue', category: 'Guard Passing', subcategory: 'Half Guard Passes' },
  { slug: 'trad-b-over-under-pass', name: 'Over-Under Pass', belt: 'blue', category: 'Guard Passing', subcategory: 'Closed Guard Passes' },
  { slug: 'trad-b-leg-drag-pass', name: 'Leg Drag Pass', belt: 'blue', category: 'Guard Passing', subcategory: 'Open Guard Passes' },
  // Mount / Back
  { slug: 'trad-b-ezekiel-choke', name: 'Ezekiel Choke from Mount', belt: 'blue', category: 'Mount', subcategory: 'Mount Attacks' },
  { slug: 'trad-b-bow-arrow-choke', name: 'Bow and Arrow Choke', belt: 'blue', category: 'Back Control', subcategory: 'Back Attacks' },
  { slug: 'trad-b-loop-choke', name: 'Loop Choke', belt: 'blue', category: 'Back Control', subcategory: 'Back Attacks' },
  // Takedowns
  { slug: 'trad-b-guard-pull', name: 'Guard Pull (Competition)', belt: 'blue', category: 'Takedowns', subcategory: 'Guard Pulling' },
  { slug: 'trad-b-harai-goshi', name: 'Harai Goshi', belt: 'blue', category: 'Takedowns', subcategory: 'Judo' },
  { slug: 'trad-b-ankle-pick', name: 'Ankle Pick', belt: 'blue', category: 'Takedowns', subcategory: 'Wrestling' },
  // Submissions
  { slug: 'trad-b-arm-triangle', name: 'Arm Triangle Choke', belt: 'blue', category: 'Submissions', subcategory: 'Chokes' },
  { slug: 'trad-b-north-south-choke', name: 'North-South Choke', belt: 'blue', category: 'Submissions', subcategory: 'Chokes' },
  { slug: 'trad-b-straight-ankle-lock', name: 'Straight Ankle Lock', belt: 'blue', category: 'Submissions', subcategory: 'Leg Locks' },

  // ─── PURPLE BELT ────────────────────────────────────────────────────────────
  { slug: 'trad-p-x-guard', name: 'X-Guard System', belt: 'purple', category: 'Guard', subcategory: 'X-Guard' },
  { slug: 'trad-p-deep-half', name: 'Deep Half Guard System', belt: 'purple', category: 'Guard', subcategory: 'Deep Half' },
  { slug: 'trad-p-berimbolo', name: 'Berimbolo', belt: 'purple', category: 'Guard', subcategory: 'Inverted Guard' },
  { slug: 'trad-p-knee-bar', name: 'Knee Bar', belt: 'purple', category: 'Submissions', subcategory: 'Leg Locks' },
  { slug: 'trad-p-calf-slicer', name: 'Calf Slicer', belt: 'purple', category: 'Submissions', subcategory: 'Leg Locks' },
  { slug: 'trad-p-baseball-choke', name: 'Baseball Bat Choke', belt: 'purple', category: 'Submissions', subcategory: 'Chokes' },
  { slug: 'trad-p-inverted-triangle', name: 'Inverted Triangle', belt: 'purple', category: 'Guard', subcategory: 'Inverted Guard' },
  { slug: 'trad-p-arm-drag-back-take', name: 'Arm Drag to Back Take', belt: 'purple', category: 'Back Control', subcategory: 'Back Takes' },
  { slug: 'trad-p-50-50-guard', name: '50/50 Guard & Entries', belt: 'purple', category: 'Guard', subcategory: '50/50' },
  { slug: 'trad-p-competition-strategy', name: 'Competition Points Strategy', belt: 'purple', category: 'Strategy', subcategory: 'Competition' },

  // ─── BROWN BELT ─────────────────────────────────────────────────────────────
  { slug: 'trad-br-heel-hook-ashi', name: 'Heel Hook from Ashi Garami', belt: 'brown', category: 'Submissions', subcategory: 'Leg Locks' },
  { slug: 'trad-br-truck', name: 'Truck Position & Attacks', belt: 'brown', category: 'Submissions', subcategory: 'Leg Locks' },
  { slug: 'trad-br-game-planning', name: 'Advanced Game Planning', belt: 'brown', category: 'Strategy', subcategory: 'Advanced' },
  { slug: 'trad-br-teaching-fundamentals', name: 'Teaching White Belt Fundamentals', belt: 'brown', category: 'Strategy', subcategory: 'Coaching' },
  { slug: 'trad-br-wrestling-concepts', name: 'Advanced Wrestling Concepts', belt: 'brown', category: 'Takedowns', subcategory: 'Advanced Wrestling' },

  // ─── BLACK BELT ─────────────────────────────────────────────────────────────
  { slug: 'trad-bl-complete-guard', name: 'Complete Guard System', belt: 'black', category: 'Guard', subcategory: 'Mastery' },
  { slug: 'trad-bl-pressure-passing', name: 'Pressure Passing System', belt: 'black', category: 'Guard Passing', subcategory: 'Mastery' },
  { slug: 'trad-bl-back-take-system', name: 'Complete Back Take System', belt: 'black', category: 'Back Control', subcategory: 'Mastery' },
]
