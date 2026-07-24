create table public.title_translations (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles(id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2,3}(?:-[A-Z]{2})?$'),
  name text not null check (char_length(name) between 1 and 160),
  native_name text check (native_name is null or char_length(native_name) between 1 and 160),
  synopsis text not null check (char_length(synopsis) between 1 and 5000),
  seo_title text check (seo_title is null or char_length(seo_title) between 1 and 70),
  seo_description text check (seo_description is null or char_length(seo_description) between 1 and 160),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title_id, locale)
);

alter table public.title_translations enable row level security;
grant select on public.title_translations to anon, authenticated;
grant insert, update, delete on public.title_translations to authenticated;

create policy "published title translations are readable"
on public.title_translations for select to anon, authenticated
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

create policy "creator editors manage title translations"
on public.title_translations for all to authenticated
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

create index title_translations_locale_title_idx
on public.title_translations(locale, title_id);
