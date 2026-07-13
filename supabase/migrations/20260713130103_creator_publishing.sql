create type public.team_role as enum ('owner', 'editor', 'uploader', 'analyst');
create type public.upload_status as enum ('queued', 'uploading', 'processing', 'ready', 'failed');

create table public.creator_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_team_memberships (
  team_id uuid not null references public.creator_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.team_role not null default 'editor',
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table public.titles
  add column creator_team_id uuid references public.creator_teams(id) on delete set null;

create table public.video_uploads (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  provider text not null default 'local' check (provider in ('local', 'mux')),
  provider_upload_id text,
  provider_asset_id text,
  playback_id text,
  filename text not null,
  bytes bigint not null default 0 check (bytes >= 0),
  status public.upload_status not null default 'queued',
  progress smallint not null default 0 check (progress between 0 and 100),
  error_message text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subtitle_tracks (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  language_code text not null check (language_code ~ '^[a-z]{2,3}(?:-[A-Z]{2})?$'),
  label text not null,
  storage_path text not null,
  is_default boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (episode_id, language_code)
);

alter table public.creator_teams enable row level security;
alter table public.creator_team_memberships enable row level security;
alter table public.video_uploads enable row level security;
alter table public.subtitle_tracks enable row level security;

grant select, insert, update on public.creator_teams to authenticated;
grant select, insert, update, delete on public.creator_team_memberships to authenticated;
grant select, insert, update, delete on public.video_uploads to authenticated;
grant select, insert, update, delete on public.subtitle_tracks to authenticated;
grant select on public.subtitle_tracks to anon;

create policy "members read their memberships"
on public.creator_team_memberships for select to authenticated
using (user_id = (select auth.uid()));

create policy "team creators add initial members"
on public.creator_team_memberships for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and exists (
    select 1 from public.creator_teams
    where id = team_id and created_by = (select auth.uid())
  )
);

create policy "members read teams"
on public.creator_teams for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.creator_team_memberships
    where team_id = creator_teams.id and user_id = (select auth.uid())
  )
);

create policy "creators make teams"
on public.creator_teams for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "team owners update teams"
on public.creator_teams for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "creators read their uploads"
on public.video_uploads for select to authenticated
using (created_by = (select auth.uid()));

create policy "creators add uploads"
on public.video_uploads for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "creators update their uploads"
on public.video_uploads for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "creators delete their uploads"
on public.video_uploads for delete to authenticated
using (created_by = (select auth.uid()));

create policy "published subtitles are public"
on public.subtitle_tracks for select to anon, authenticated
using (
  exists (
    select 1 from public.episodes
    where episodes.id = episode_id
      and episodes.status = 'published'
      and episodes.available_at <= now()
  )
  or created_by = (select auth.uid())
);

create policy "creators manage their subtitles"
on public.subtitle_tracks for all to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create index creator_team_members_user_idx
  on public.creator_team_memberships(user_id, joined_at desc);
create index video_uploads_episode_idx
  on public.video_uploads(episode_id, created_at desc);
create index subtitle_tracks_episode_idx
  on public.subtitle_tracks(episode_id, language_code);
