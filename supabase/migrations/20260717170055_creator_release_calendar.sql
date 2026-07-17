create table public.creator_releases (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.creator_teams(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  kind text not null check (kind in ('episode', 'premiere', 'trailer', 'announcement')),
  status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'live', 'published', 'cancelled')),
  scheduled_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_releases enable row level security;

grant select on public.creator_releases to authenticated;

create policy "team members read creator releases"
on public.creator_releases for select to authenticated
using (exists (
  select 1 from public.creator_team_memberships
  where team_id = creator_releases.team_id
    and user_id = (select auth.uid())
));

create index creator_releases_team_schedule_idx
  on public.creator_releases(team_id, scheduled_at desc);
