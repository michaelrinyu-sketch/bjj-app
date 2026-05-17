-- ============================================================
-- BJJ Companion App — Schema v3 additions
-- Run AFTER schema.sql and schema_v2.sql
-- ============================================================

alter table public.training_sessions
  add column if not exists game_plan           text not null default '',
  add column if not exists reflection          text not null default '',
  add column if not exists submissions_landed  int  not null default 0 check (submissions_landed  >= 0),
  add column if not exists submissions_caught  int  not null default 0 check (submissions_caught  >= 0),
  add column if not exists sweeps              int  not null default 0 check (sweeps              >= 0),
  add column if not exists takedowns           int  not null default 0 check (takedowns            >= 0),
  add column if not exists dominant_positions  int  not null default 0 check (dominant_positions  >= 0);
