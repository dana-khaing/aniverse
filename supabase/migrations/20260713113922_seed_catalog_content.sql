insert into public.genres (slug, name) values
  ('action', 'Action'),
  ('adventure', 'Adventure'),
  ('drama', 'Drama'),
  ('fantasy', 'Fantasy'),
  ('mystery', 'Mystery'),
  ('romance', 'Romance'),
  ('sci-fi', 'Sci-fi'),
  ('supernatural', 'Supernatural')
on conflict (slug) do update set name = excluded.name;

insert into public.studios (id, slug, name, description) values
  ('10000000-0000-4000-8000-000000000001', 'lumen-works', 'Lumen Works', 'Character-led fantasy from independent animators.'),
  ('10000000-0000-4000-8000-000000000002', 'voltage-frame', 'Voltage Frame', 'High-energy science fiction with a neon pulse.'),
  ('10000000-0000-4000-8000-000000000003', 'mallow-pictures', 'Mallow Pictures', 'Intimate stories about memory and connection.'),
  ('10000000-0000-4000-8000-000000000004', 'northwind', 'Northwind', 'Adventure animation built around impossible worlds.'),
  ('10000000-0000-4000-8000-000000000005', 'brass-lantern', 'Brass Lantern', 'Mystery, folklore, and meticulous hand-drawn worlds.'),
  ('10000000-0000-4000-8000-000000000006', 'mosslight', 'Mosslight', 'Quiet supernatural drama from a small creator collective.')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.titles (
  id, slug, name, native_name, synopsis, format, status, release_year,
  poster_tone, studio_id, average_score, popularity_score, published_at
) values
  ('20000000-0000-4000-8000-000000000001', 'echoes-of-asteria', 'Echoes of Asteria', 'アステリアの残響', 'When the stars begin to disappear, a young cartographer discovers that her forgotten memories may be the key to saving two worlds.', 'series', 'published', 2026, 'violet', '10000000-0000-4000-8000-000000000001', 9.2, 9800, '2026-01-05T18:30:00Z'),
  ('20000000-0000-4000-8000-000000000002', 'neon-ronin', 'Neon Ronin', 'ネオン浪人', 'A masterless swordsman hunts corrupted memories through the rain-lit streets of a city that never sleeps.', 'series', 'published', 2026, 'cyan', '10000000-0000-4000-8000-000000000002', 8.9, 9100, '2026-02-02T20:00:00Z'),
  ('20000000-0000-4000-8000-000000000003', 'paper-moons', 'Paper Moons', '紙の月', 'Two childhood friends exchange letters with their future selves and slowly rewrite the summer that separated them.', 'series', 'published', 2026, 'rose', '10000000-0000-4000-8000-000000000003', 8.7, 8400, '2026-03-11T19:30:00Z'),
  ('20000000-0000-4000-8000-000000000004', 'skybound', 'Skybound', '空へ', 'A rookie airship crew maps the storm wall at the edge of the world while an ancient engine wakes below deck.', 'series', 'published', 2025, 'blue', '10000000-0000-4000-8000-000000000004', 9.0, 9400, '2025-09-18T18:00:00Z'),
  ('20000000-0000-4000-8000-000000000005', 'the-last-alchemist', 'The Last Alchemist', '最後の錬金術師', 'The final keeper of a forbidden craft must solve a royal murder before her own order is erased from history.', 'series', 'published', 2025, 'amber', '10000000-0000-4000-8000-000000000005', 8.8, 8600, '2025-10-24T17:30:00Z'),
  ('20000000-0000-4000-8000-000000000006', 'garden-of-spirits', 'Garden of Spirits', '精霊の庭', 'A quiet gardener can hear the wishes of forgotten spirits, but granting the last wish may cost her every memory.', 'series', 'published', 2026, 'emerald', '10000000-0000-4000-8000-000000000006', 8.6, 7900, '2026-04-08T17:00:00Z')
on conflict (slug) do update set
  name = excluded.name,
  native_name = excluded.native_name,
  synopsis = excluded.synopsis,
  format = excluded.format,
  status = excluded.status,
  release_year = excluded.release_year,
  poster_tone = excluded.poster_tone,
  studio_id = excluded.studio_id,
  average_score = excluded.average_score,
  popularity_score = excluded.popularity_score,
  published_at = excluded.published_at,
  updated_at = now();

with mappings(title_slug, genre_slug) as (
  values
    ('echoes-of-asteria', 'fantasy'), ('echoes-of-asteria', 'adventure'), ('echoes-of-asteria', 'drama'),
    ('neon-ronin', 'sci-fi'), ('neon-ronin', 'action'),
    ('paper-moons', 'drama'), ('paper-moons', 'romance'),
    ('skybound', 'adventure'), ('skybound', 'fantasy'),
    ('the-last-alchemist', 'mystery'), ('the-last-alchemist', 'fantasy'),
    ('garden-of-spirits', 'supernatural'), ('garden-of-spirits', 'drama')
)
insert into public.title_genres (title_id, genre_id)
select titles.id, genres.id
from mappings
join public.titles on titles.slug = mappings.title_slug
join public.genres on genres.slug = mappings.genre_slug
on conflict do nothing;

insert into public.seasons (id, title_id, number, name, release_date) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1, 'Season 1', '2026-01-05'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 1, 'Season 1', '2026-02-02'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 1, 'Season 1', '2026-03-11'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 1, 'Season 1', '2025-09-18'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000005', 1, 'Season 1', '2025-10-24'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000006', 1, 'Season 1', '2026-04-08')
on conflict (title_id, number) do update set
  name = excluded.name,
  release_date = excluded.release_date;

with episode_counts(season_id, total, first_release) as (
  values
    ('30000000-0000-4000-8000-000000000001'::uuid, 12, '2026-01-05T18:30:00Z'::timestamptz),
    ('30000000-0000-4000-8000-000000000002'::uuid, 8, '2026-02-02T20:00:00Z'::timestamptz),
    ('30000000-0000-4000-8000-000000000003'::uuid, 6, '2026-03-11T19:30:00Z'::timestamptz),
    ('30000000-0000-4000-8000-000000000004'::uuid, 18, '2025-09-18T18:00:00Z'::timestamptz),
    ('30000000-0000-4000-8000-000000000005'::uuid, 10, '2025-10-24T17:30:00Z'::timestamptz),
    ('30000000-0000-4000-8000-000000000006'::uuid, 4, '2026-04-08T17:00:00Z'::timestamptz)
), generated as (
  select episode_counts.season_id, episode_number, episode_counts.first_release
  from episode_counts
  cross join lateral generate_series(1, episode_counts.total) as episode_number
)
insert into public.episodes (
  season_id, number, slug, title, synopsis, duration_seconds, status, available_at
)
select
  season_id,
  episode_number,
  'episode-' || episode_number,
  case when episode_number = 1 then 'Where the sky remembers' else 'Episode ' || episode_number end,
  case when episode_number = 1 then 'A mysterious map falls from a starless sky.' else 'Continue the story.' end,
  1440,
  'published',
  first_release + ((episode_number - 1) * interval '7 days')
from generated
on conflict (season_id, number) do update set
  slug = excluded.slug,
  title = excluded.title,
  synopsis = excluded.synopsis,
  duration_seconds = excluded.duration_seconds,
  status = excluded.status,
  available_at = excluded.available_at,
  updated_at = now();
