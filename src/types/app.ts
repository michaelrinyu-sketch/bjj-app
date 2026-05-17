export type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black'
export type GymSystem = 'traditional' | 'tenth_planet' | 'gracie_barra' | 'gracie_combatives' | 'custom'
export type PrimaryGoal = 'competition' | 'self_defense' | 'fitness' | 'recreation'
export type SessionType = 'gi' | 'nogi' | 'open_mat' | 'drilling' | 'competition'
export type TechniqueStatus = 'unseen' | 'learning' | 'drilling' | 'comfortable'
export type InjurySeverity = 'minor' | 'moderate' | 'severe'
export type GoalStatus = 'active' | 'completed' | 'abandoned'
export type GoalCategory = 'technique' | 'competition' | 'fitness' | 'belt_promotion' | 'other'
export type TournamentStatus = 'planned' | 'registered' | 'completed' | 'withdrew'

export interface Profile {
  id: string
  display_name: string | null
  belt_level: BeltLevel | null
  stripes: number
  gym_system: GymSystem | null
  primary_goal: PrimaryGoal | null
  onboarding_complete: boolean
  stripe_customer_id: string | null
  is_subscribed: boolean
  subscription_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface TrainingSession {
  id: string
  user_id: string
  session_date: string
  duration_minutes: number
  session_type: SessionType
  techniques_drilled: string[]
  sparring_rounds: number
  notes: string
  energy_level: number
  game_plan: string
  reflection: string
  submissions_landed: number
  submissions_caught: number
  sweeps: number
  takedowns: number
  dominant_positions: number
  training_partners: string[]
  created_at: string
}

export interface PartnerRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  // joined
  from_profile?: { display_name: string | null; belt_level: string | null; stripes: number }
  to_profile?:   { display_name: string | null; belt_level: string | null; stripes: number }
}

export interface PartnerConnection {
  id: string
  user_id: string
  partner_id: string
  created_at: string
}

export interface TechniqueProgress {
  id: string
  user_id: string
  technique_slug: string
  gym_system: GymSystem
  status: TechniqueStatus
  confidence: number
  last_drilled_at: string | null
  notes: string
  updated_at: string
}

export interface Video {
  id: string
  title: string
  description: string
  url: string
  thumbnail_url: string | null
  belt_levels: BeltLevel[]
  gym_systems: GymSystem[]
  category: string
  tags: string[]
  duration_seconds: number | null
  is_premium: boolean
  created_at: string
}

export interface UserVideo {
  id: string
  user_id: string
  title: string
  url: string
  position: string
  sub_position: string | null
  notes: string
  technique_slugs: string[]
  created_at: string
}

export interface VideoAttempt {
  id: string
  user_id: string
  video_id: string
  successful: number
  unsuccessful: number
  updated_at: string
}

export interface Tournament {
  id: string
  user_id: string
  name: string
  event_date: string
  location: string
  organization: string
  weight_class: string
  division: string
  registration_deadline: string | null
  goal: string
  result: string | null
  status: TournamentStatus
  notes: string
  created_at: string
}

export interface TournamentPrepItem {
  id: string
  tournament_id: string
  user_id: string
  category: 'game_plan' | 'physical' | 'gear' | 'logistics' | 'mental'
  description: string
  is_complete: boolean
  due_date: string | null
}

export interface Injury {
  id: string
  user_id: string
  body_part: string
  injury_type: string
  severity: InjurySeverity
  occurred_on: string
  resolved_on: string | null
  is_active: boolean
  description: string
  affected_techniques: string[]
  notes: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  category: GoalCategory
  target_date: string | null
  status: GoalStatus
  linked_technique_slug: string | null
  linked_tournament_id: string | null
  milestones: { text: string; complete: boolean }[]
  created_at: string
  updated_at: string
}

export const BELT_COLORS: Record<BeltLevel, string> = {
  white: 'bg-belt-white text-gray-900',
  blue: 'bg-belt-blue text-white',
  purple: 'bg-belt-purple text-white',
  brown: 'bg-belt-brown text-white',
  black: 'bg-belt-black text-white',
}

export const BELT_LABELS: Record<BeltLevel, string> = {
  white: 'White Belt',
  blue: 'Blue Belt',
  purple: 'Purple Belt',
  brown: 'Brown Belt',
  black: 'Black Belt',
}

export const GYM_SYSTEM_LABELS: Record<GymSystem, string> = {
  traditional: 'Traditional / IBJJF',
  tenth_planet: '10th Planet',
  gracie_barra: 'Gracie Barra',
  gracie_combatives: 'Gracie Combatives',
  custom: 'Custom / Independent',
}
