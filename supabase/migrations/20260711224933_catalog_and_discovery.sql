create type public.title_status as enum ('draft', 'review', 'scheduled', 'published', 'unpublished', 'removed');
create type public.title_format as enum ('series', 'movie', 'ova', 'ona', 'special');

create table public.studios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  logo_path text,
  created_at timestamptz not null default now()
);

create table public.titles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  english_name text,
  native_name text,
  synopsis text not null,
  format public.title_format not null default 'series',
  status public.title_status not null default 'draft',
  release_year int check (release_year between 1900 and 2200),
  age_rating text not null default 'PG-13',
  poster_tone text not null default 'violet',
  poster_path text,
  banner_path text,
  studio_id uuid references public.studios(id) on delete set null,
  creator_user_id uuid references auth.users(id) on delete set null,
  average_score numeric(3,1) not null default 0 check (average_score between 0 and 10),
  popularity_score bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(english_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(native_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(synopsis, '')), 'C')
  ) stored
);

create table public.genres (id smallint generated always as identity primary key, slug text not null unique, name text not null unique);
create table public.title_genres (title_id uuid references public.titles(id) on delete cascade, genre_id smallint references public.genres(id) on delete cascade, primary key (title_id, genre_id));

create table public.seasons (
  id uuid primary key default gen_random_uuid(), title_id uuid not null references public.titles(id) on delete cascade,
  number int not null check (number > 0), name text, synopsis text, release_date date,
  created_at timestamptz not null default now(), unique (title_id, number)
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(), season_id uuid not null references public.seasons(id) on delete cascade,
  number numeric(6,2) not null check (number > 0), slug text not null, title text not null,
  synopsis text, duration_seconds int check (duration_seconds between 1 and 16200),
  status public.title_status not null default 'draft', available_at timestamptz,
  thumbnail_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (season_id, number), unique (season_id, slug)
);

alter table public.studios enable row level security;
alter table public.titles enable row level security;
alter table public.genres enable row level security;
alter table public.title_genres enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;

grant select on public.studios, public.titles, public.genres, public.title_genres, public.seasons, public.episodes to anon, authenticated;
create policy "studios are public" on public.studios for select to anon, authenticated using (true);
create policy "published titles are public" on public.titles for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "genres are public" on public.genres for select to anon, authenticated using (true);
create policy "published title genres are public" on public.title_genres for select to anon, authenticated using (exists (select 1 from public.titles where id = title_id and status = 'published'));
create policy "published seasons are public" on public.seasons for select to anon, authenticated using (exists (select 1 from public.titles where id = title_id and status = 'published'));
create policy "published episodes are public" on public.episodes for select to anon, authenticated using (status = 'published' and available_at <= now());

create index titles_search_idx on public.titles using gin(search_document);
create index titles_discovery_idx on public.titles(status, published_at desc, popularity_score desc);
create index titles_year_format_idx on public.titles(release_year, format);
create index episodes_release_idx on public.episodes(status, available_at desc);
