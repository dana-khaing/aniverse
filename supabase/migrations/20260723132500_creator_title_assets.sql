create table public.title_assets (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles(id) on delete cascade,
  kind text not null check (kind in ('poster', 'backdrop', 'trailer')),
  storage_path text,
  source_url text,
  mime_type text,
  bytes bigint check (bytes is null or bytes between 1 and 20971520),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title_id, kind),
  check (
    (kind in ('poster', 'backdrop') and storage_path is not null and source_url is null)
    or (kind = 'trailer' and source_url is not null and storage_path is null)
  )
);

alter table public.title_assets enable row level security;
grant select on public.title_assets to anon, authenticated;
grant insert, update, delete on public.title_assets to authenticated;

create policy "published title assets are readable"
on public.title_assets for select to anon, authenticated
using (
  exists (
    select 1 from public.titles
    where titles.id = title_id and titles.status = 'published'
  )
  or exists (
    select 1
    from public.titles
    join public.creator_team_memberships
      on creator_team_memberships.team_id = titles.creator_team_id
    where titles.id = title_id
      and creator_team_memberships.user_id = (select auth.uid())
  )
);

create policy "creator editors manage title assets"
on public.title_assets for all to authenticated
using (
  exists (
    select 1
    from public.titles
    join public.creator_team_memberships
      on creator_team_memberships.team_id = titles.creator_team_id
    where titles.id = title_id
      and creator_team_memberships.user_id = (select auth.uid())
      and creator_team_memberships.role in ('owner', 'editor')
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.titles
    join public.creator_team_memberships
      on creator_team_memberships.team_id = titles.creator_team_id
    where titles.id = title_id
      and creator_team_memberships.user_id = (select auth.uid())
      and creator_team_memberships.role in ('owner', 'editor')
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'title-artwork',
  'title-artwork',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "published title artwork is public"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'title-artwork'
  and exists (
    select 1
    from public.title_assets
    join public.titles on titles.id = title_assets.title_id
    where title_assets.storage_path = storage.objects.name
      and titles.status = 'published'
  )
);

create policy "creator editors upload title artwork"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'title-artwork'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "creator editors replace title artwork"
on storage.objects for update to authenticated
using (
  bucket_id = 'title-artwork'
  and owner_id = (select auth.uid())::text
);

create policy "creator editors delete title artwork"
on storage.objects for delete to authenticated
using (
  bucket_id = 'title-artwork'
  and owner_id = (select auth.uid())::text
);

create index title_assets_title_kind_idx
on public.title_assets(title_id, kind);
