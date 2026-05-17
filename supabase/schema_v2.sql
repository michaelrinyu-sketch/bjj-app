-- ============================================================
-- BJJ Companion App — Schema v2 additions
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- Add technique tags to user_videos
alter table public.user_videos
  add column if not exists technique_slugs text[] not null default '{}';

-- ============================================================
-- VIDEO ATTEMPTS
-- Per-video attempt tally. Counts are pooled across all videos
-- that share a technique_slug tag to feed the Technique Map.
-- ============================================================
create table if not exists public.video_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  video_id     uuid not null references public.user_videos(id) on delete cascade,
  successful   int not null default 0 check (successful >= 0),
  unsuccessful int not null default 0 check (unsuccessful >= 0),
  updated_at   timestamptz not null default now(),
  unique (user_id, video_id)
);

create index if not exists video_attempts_user
  on public.video_attempts (user_id);

alter table public.video_attempts enable row level security;

create policy "video_attempts: own rows" on public.video_attempts
  for all using (auth.uid() = user_id);
