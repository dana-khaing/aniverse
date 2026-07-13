create table public.ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  score smallint not null check (score between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid references public.titles(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  is_spoiler boolean not null default false,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check (title_id is not null or episode_id is not null)
);

create table public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'love', 'insightful')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, reaction)
);

create table public.creator_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ratings enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.creator_follows enable row level security;
alter table public.notifications enable row level security;

grant select on public.ratings, public.comments, public.comment_reactions to anon, authenticated;
grant insert, update, delete on public.ratings, public.comments, public.comment_reactions to authenticated;
grant select, insert, delete on public.creator_follows to authenticated;
grant select, update, delete on public.notifications to authenticated;

create policy "ratings are public" on public.ratings for select to anon, authenticated using (true);
create policy "users manage ratings" on public.ratings for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "comments are public" on public.comments for select to anon, authenticated using (deleted_at is null);
create policy "users create comments" on public.comments for insert to authenticated with check (user_id=(select auth.uid()));
create policy "users update comments" on public.comments for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "users delete comments" on public.comments for delete to authenticated using (user_id=(select auth.uid()));
create policy "reactions are public" on public.comment_reactions for select to anon, authenticated using (true);
create policy "users manage reactions" on public.comment_reactions for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "users manage follows" on public.creator_follows for all to authenticated using (follower_id=(select auth.uid())) with check (follower_id=(select auth.uid()));
create policy "users read notifications" on public.notifications for select to authenticated using (user_id=(select auth.uid()));
create policy "users update notifications" on public.notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "users delete notifications" on public.notifications for delete to authenticated using (user_id=(select auth.uid()));

create index comments_title_created_idx on public.comments(title_id, created_at desc) where deleted_at is null;
create index comments_parent_idx on public.comments(parent_id, created_at);
create index notifications_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
