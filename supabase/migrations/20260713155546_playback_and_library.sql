create table public.watch_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  position_seconds int not null default 0 check (position_seconds >= 0),
  duration_seconds int not null check (duration_seconds > 0),
  completed boolean not null default false,
  last_watched_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

create table public.custom_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.custom_list_items (
  list_id uuid not null references public.custom_lists(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, title_id)
);

alter table public.watch_progress enable row level security;
alter table public.favorites enable row level security;
alter table public.custom_lists enable row level security;
alter table public.custom_list_items enable row level security;

grant select, insert, update, delete on public.watch_progress to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.custom_lists to authenticated;
grant select, insert, delete on public.custom_list_items to authenticated;

create policy "users manage watch progress"
on public.watch_progress for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users manage favorites"
on public.favorites for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "owners manage lists"
on public.custom_lists for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "owners manage list items"
on public.custom_list_items for all to authenticated
using (
  exists (
    select 1 from public.custom_lists
    where custom_lists.id = list_id
      and custom_lists.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.custom_lists
    where custom_lists.id = list_id
      and custom_lists.user_id = (select auth.uid())
  )
);

create index watch_progress_recent_idx
  on public.watch_progress(user_id, last_watched_at desc);
create index favorites_recent_idx
  on public.favorites(user_id, created_at desc);
create index custom_lists_user_idx
  on public.custom_lists(user_id, updated_at desc);
