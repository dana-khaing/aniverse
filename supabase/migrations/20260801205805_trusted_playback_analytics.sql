create table public.playback_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  expires_at timestamptz not null default now()+interval '2 hours', created_at timestamptz not null default now()
);
alter table public.playback_sessions enable row level security;
grant select,insert on public.playback_sessions to authenticated;
create policy "users create playback sessions" on public.playback_sessions for insert to authenticated with check(user_id=(select auth.uid()));
create policy "users read playback sessions" on public.playback_sessions for select to authenticated using(user_id=(select auth.uid()));
alter table public.playback_events add column session_id uuid references public.playback_sessions(id) on delete set null,
  add column event_id uuid;
create unique index playback_events_session_event_idx on public.playback_events(session_id,event_id) where session_id is not null and event_id is not null;
create index playback_sessions_expiry_idx on public.playback_sessions(expires_at);
