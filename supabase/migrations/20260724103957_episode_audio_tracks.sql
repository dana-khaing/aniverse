create type public.audio_track_status as enum ('preparing', 'ready', 'errored');

create table public.episode_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  video_upload_id uuid not null references public.video_uploads(id) on delete cascade,
  provider_track_id text,
  language_code text not null check (language_code ~ '^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2}|-[0-9]{3})?$'),
  label text not null check (char_length(label) between 1 and 80),
  source_url text not null check (source_url ~ '^https://'),
  is_default boolean not null default false,
  status public.audio_track_status not null default 'preparing',
  error_message text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_upload_id, language_code)
);

alter table public.episode_audio_tracks enable row level security;

grant select, insert, update, delete on public.episode_audio_tracks to authenticated;
grant select on public.episode_audio_tracks to anon;

create policy "published audio metadata is public"
on public.episode_audio_tracks for select to anon, authenticated
using (
  status = 'ready'
  and exists (
    select 1 from public.episodes
    where episodes.id = episode_id
      and episodes.status = 'published'
      and episodes.available_at <= now()
  )
  or created_by = (select auth.uid())
);

create policy "creator teams add audio tracks"
on public.episode_audio_tracks for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.episodes
    join public.seasons on seasons.id = episodes.season_id
    join public.titles on titles.id = seasons.title_id
    join public.creator_team_memberships on creator_team_memberships.team_id = titles.creator_team_id
    where episodes.id = episode_id
      and creator_team_memberships.user_id = (select auth.uid())
      and creator_team_memberships.role in ('owner', 'editor', 'uploader')
  )
);

create policy "creator teams update audio tracks"
on public.episode_audio_tracks for update to authenticated
using (
  exists (
    select 1
    from public.episodes
    join public.seasons on seasons.id = episodes.season_id
    join public.titles on titles.id = seasons.title_id
    join public.creator_team_memberships on creator_team_memberships.team_id = titles.creator_team_id
    where episodes.id = episode_id
      and creator_team_memberships.user_id = (select auth.uid())
      and creator_team_memberships.role in ('owner', 'editor', 'uploader')
  )
)
with check (created_by = (select auth.uid()));

create policy "creator teams delete audio tracks"
on public.episode_audio_tracks for delete to authenticated
using (
  exists (
    select 1
    from public.episodes
    join public.seasons on seasons.id = episodes.season_id
    join public.titles on titles.id = seasons.title_id
    join public.creator_team_memberships on creator_team_memberships.team_id = titles.creator_team_id
    where episodes.id = episode_id
      and creator_team_memberships.user_id = (select auth.uid())
      and creator_team_memberships.role in ('owner', 'editor', 'uploader')
  )
);

create index episode_audio_tracks_episode_ready_idx
  on public.episode_audio_tracks(episode_id, is_default desc, created_at)
  where status = 'ready';

create index episode_audio_tracks_upload_idx
  on public.episode_audio_tracks(video_upload_id, created_at desc);
