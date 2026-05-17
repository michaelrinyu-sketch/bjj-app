-- ============================================================
-- BJJ Companion App — Full Supabase Schema
-- Run this in Supabase > SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- ============================================================
-- 1. PROFILES
-- One row per auth user, created automatically on signup.
-- ============================================================
create table if not exists public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  display_name           text,
  belt_level             text check (belt_level in ('white','blue','purple','brown','black')),
  stripes                int not null default 0 check (stripes between 0 and 4),
  gym_system             text check (gym_system in ('traditional','tenth_planet','gracie_barra','gracie_combatives','custom')),
  primary_goal           text check (primary_goal in ('competition','self_defense','fitness','recreation')),
  onboarding_complete    boolean not null default false,
  stripe_customer_id     text,
  is_subscribed          boolean not null default false,
  subscription_expires_at timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. TRAINING SESSIONS
-- ============================================================
create table if not exists public.training_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  session_date       date not null,
  duration_minutes   int not null default 60 check (duration_minutes > 0),
  session_type       text not null check (session_type in ('gi','nogi','open_mat','drilling','competition')),
  sparring_rounds    int not null default 0 check (sparring_rounds >= 0),
  notes              text not null default '',
  energy_level       int not null default 3 check (energy_level between 1 and 5),
  techniques_drilled text[] not null default '{}',
  created_at         timestamptz not null default now()
);

create index if not exists training_sessions_user_date
  on public.training_sessions (user_id, session_date desc);


-- ============================================================
-- 3. TECHNIQUE PROGRESS
-- Tracks each user's status on curriculum techniques.
-- ============================================================
create table if not exists public.technique_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  technique_slug  text not null,
  gym_system      text not null check (gym_system in ('traditional','tenth_planet','gracie_barra','gracie_combatives','custom')),
  status          text not null default 'unseen' check (status in ('unseen','learning','drilling','comfortable')),
  confidence      int not null default 0 check (confidence between 0 and 100),
  last_drilled_at timestamptz,
  notes           text not null default '',
  updated_at      timestamptz not null default now(),
  unique (user_id, technique_slug)
);

create index if not exists technique_progress_user_system
  on public.technique_progress (user_id, gym_system);


-- ============================================================
-- 4. GOALS
-- ============================================================
create table if not exists public.goals (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  title                 text not null,
  description           text not null default '',
  category              text not null check (category in ('technique','competition','fitness','belt_promotion','other')),
  target_date           date,
  status                text not null default 'active' check (status in ('active','completed','abandoned')),
  linked_technique_slug text,
  linked_tournament_id  uuid,
  milestones            jsonb not null default '[]',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists goals_user_status
  on public.goals (user_id, status);


-- ============================================================
-- 5. TOURNAMENTS
-- ============================================================
create table if not exists public.tournaments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  name                  text not null,
  event_date            date not null,
  location              text not null default '',
  organization          text not null default '',
  weight_class          text not null default '',
  division              text not null default '',
  registration_deadline date,
  goal                  text not null default '',
  result                text,
  status                text not null default 'planned' check (status in ('planned','registered','completed','withdrew')),
  notes                 text not null default '',
  created_at            timestamptz not null default now()
);

create index if not exists tournaments_user_date
  on public.tournaments (user_id, event_date desc);


-- ============================================================
-- 6. TOURNAMENT PREP ITEMS
-- ============================================================
create table if not exists public.tournament_prep_items (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  category       text not null check (category in ('game_plan','physical','gear','logistics','mental')),
  description    text not null,
  is_complete    boolean not null default false,
  due_date       date
);

create index if not exists prep_items_tournament
  on public.tournament_prep_items (tournament_id);


-- ============================================================
-- 7. INJURIES
-- ============================================================
create table if not exists public.injuries (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  body_part            text not null,
  injury_type          text not null,
  severity             text not null check (severity in ('minor','moderate','severe')),
  occurred_on          date not null,
  resolved_on          date,
  is_active            boolean not null default true,
  description          text not null default '',
  affected_techniques  text[] not null default '{}',
  notes                text not null default '',
  created_at           timestamptz not null default now()
);

create index if not exists injuries_user_active
  on public.injuries (user_id, is_active);


-- ============================================================
-- 8. USER VIDEOS
-- User-saved YouTube/Vimeo footage with position tags.
-- ============================================================
create table if not exists public.user_videos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  url          text not null,
  position     text not null default 'Other',
  sub_position text,
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists user_videos_user_position
  on public.user_videos (user_id, position);


-- ============================================================
-- ROW LEVEL SECURITY
-- Each user can only read and write their own rows.
-- ============================================================

alter table public.profiles             enable row level security;
alter table public.training_sessions    enable row level security;
alter table public.technique_progress   enable row level security;
alter table public.goals                enable row level security;
alter table public.tournaments          enable row level security;
alter table public.tournament_prep_items enable row level security;
alter table public.injuries             enable row level security;
alter table public.user_videos          enable row level security;

-- profiles: users can read and update only their own row
create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

-- training_sessions
create policy "training_sessions: own rows" on public.training_sessions
  for all using (auth.uid() = user_id);

-- technique_progress
create policy "technique_progress: own rows" on public.technique_progress
  for all using (auth.uid() = user_id);

-- goals
create policy "goals: own rows" on public.goals
  for all using (auth.uid() = user_id);

-- tournaments
create policy "tournaments: own rows" on public.tournaments
  for all using (auth.uid() = user_id);

-- tournament_prep_items
create policy "tournament_prep_items: own rows" on public.tournament_prep_items
  for all using (auth.uid() = user_id);

-- injuries
create policy "injuries: own rows" on public.injuries
  for all using (auth.uid() = user_id);

-- user_videos
create policy "user_videos: own rows" on public.user_videos
  for all using (auth.uid() = user_id);
