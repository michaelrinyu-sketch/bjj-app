-- ============================================================
-- BJJ Companion App — Schema v4: Partner System
-- Run after schema.sql / schema_v2.sql / schema_v3.sql
-- ============================================================

-- ── Training session: add partner tags ───────────────────────
alter table public.training_sessions
  add column if not exists training_partners text[] not null default '{}';

-- ── Profiles: allow any authenticated user to read ───────────
-- Needed so users can search for each other and view partner feeds.
-- Write operations still restricted to own row via the existing policy.
create policy "profiles: authenticated read" on public.profiles
  for select using (auth.role() = 'authenticated');


-- ── Partner requests ─────────────────────────────────────────
create table if not exists public.partner_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id   uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create index if not exists partner_requests_to   on public.partner_requests (to_user_id);
create index if not exists partner_requests_from on public.partner_requests (from_user_id);

alter table public.partner_requests enable row level security;

-- Sender or receiver can read
create policy "partner_requests: participants read" on public.partner_requests
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Anyone authenticated can send (insert as sender)
create policy "partner_requests: sender insert" on public.partner_requests
  for insert with check (auth.uid() = from_user_id);

-- Receiver can update (accept / decline)
create policy "partner_requests: receiver update" on public.partner_requests
  for update using (auth.uid() = to_user_id);

-- Sender can withdraw (delete) a pending request
create policy "partner_requests: sender delete" on public.partner_requests
  for delete using (auth.uid() = from_user_id and status = 'pending');


-- ── Partner connections (bidirectional) ──────────────────────
-- When A–B connect, two rows are inserted: (A,B) and (B,A).
-- This makes "SELECT partner_id FROM partner_connections WHERE user_id = me" trivial.
create table if not exists public.partner_connections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, partner_id)
);

create index if not exists partner_connections_user on public.partner_connections (user_id);

alter table public.partner_connections enable row level security;

-- Users can read their own connections
create policy "partner_connections: own read" on public.partner_connections
  for select using (auth.uid() = user_id);


-- ── Allow partners to read each other's training sessions ────
-- Partners can see session dates/durations for feed & streak calculation.
-- The existing "own rows" policy already covers own sessions.
create policy "training_sessions: partner read" on public.training_sessions
  for select using (
    auth.uid() = user_id or
    exists (
      select 1 from public.partner_connections pc
      where pc.user_id = auth.uid() and pc.partner_id = training_sessions.user_id
    )
  );


-- ── accept_partner_request() ─────────────────────────────────
-- Security-definer so it can insert both bidirectional connection rows.
create or replace function public.accept_partner_request(request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  req public.partner_requests%rowtype;
begin
  select * into req
  from public.partner_requests
  where id = request_id
    and to_user_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'Request not found or not authorized';
  end if;

  update public.partner_requests set status = 'accepted' where id = request_id;

  insert into public.partner_connections (user_id, partner_id) values
    (req.from_user_id, req.to_user_id),
    (req.to_user_id,   req.from_user_id)
  on conflict do nothing;
end;
$$;


-- ── disconnect_partner() ──────────────────────────────────────
-- Removes both directional rows so neither side sees the other.
create or replace function public.disconnect_partner(target_partner_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.partner_connections
  where (user_id = auth.uid() and partner_id = target_partner_id)
     or (user_id = target_partner_id and partner_id = auth.uid());

  -- Also reset any accepted request so they can reconnect later
  update public.partner_requests
  set status = 'declined'
  where status = 'accepted'
    and ((from_user_id = auth.uid() and to_user_id = target_partner_id)
      or (from_user_id = target_partner_id and to_user_id = auth.uid()));
end;
$$;
