create table public.episode_markers (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  start_seconds int not null check (start_seconds >= 0),
  end_seconds int check (end_seconds is null or end_seconds > start_seconds),
  kind text not null default 'chapter' check (kind in ('chapter', 'intro', 'outro')),
  position smallint not null default 0 check (position >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, position)
);

alter table public.episode_markers enable row level security;
grant select on public.episode_markers to anon, authenticated;
grant insert, update, delete on public.episode_markers to authenticated;

create policy "published episode markers are readable"
on public.episode_markers for select to anon, authenticated
using (
  exists (
    select 1 from public.episodes
    where episodes.id = episode_id
      and episodes.status = 'published'
      and episodes.available_at <= now()
  )
  or created_by = (select auth.uid())
);

create policy "creator teams manage episode markers"
on public.episode_markers for all to authenticated
using (
  exists (
    select 1 from public.episodes
    join public.seasons on seasons.id = episodes.season_id
    join public.titles on titles.id = seasons.title_id
    join public.creator_team_memberships on creator_team_memberships.team_id = titles.creator_team_id
    where episodes.id = episode_id
      and creator_team_memberships.user_id = (select auth.uid())
      and creator_team_memberships.role in ('owner', 'editor')
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.episodes
    join public.seasons on seasons.id = episodes.season_id
    join public.titles on titles.id = seasons.title_id
    join public.creator_team_memberships on creator_team_memberships.team_id = titles.creator_team_id
    where episodes.id = episode_id
      and creator_team_memberships.user_id = (select auth.uid())
      and creator_team_memberships.role in ('owner', 'editor')
  )
);

create index episode_markers_episode_position_idx on public.episode_markers(episode_id, position);
