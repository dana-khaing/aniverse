create table public.watchlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  added_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

alter table public.custom_lists add column position integer not null default 0 check (position >= 0);
alter table public.custom_list_items add column position integer not null default 0 check (position >= 0);

alter table public.watchlist_items enable row level security;
grant select, insert, update, delete on public.watchlist_items to authenticated;

create policy "users manage watchlist"
on public.watchlist_items for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index watchlist_items_order_idx on public.watchlist_items(user_id, position, added_at desc);
create index custom_lists_order_idx on public.custom_lists(user_id, position, updated_at desc);
create index custom_list_items_order_idx on public.custom_list_items(list_id, position, added_at);
