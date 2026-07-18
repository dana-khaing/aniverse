create table public.community_posts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.community_posts(id) on delete cascade, subject text not null default 'Community post' check (char_length(subject) between 2 and 120),
  body text not null check (char_length(body) between 1 and 2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(post_id,user_id)
);
alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;
grant select on public.community_posts,public.community_post_likes to anon,authenticated;
grant insert,update,delete on public.community_posts,public.community_post_likes to authenticated;
create policy "community posts are public" on public.community_posts for select to anon,authenticated using(true);
create policy "users create community posts" on public.community_posts for insert to authenticated with check(user_id=(select auth.uid()));
create policy "users update community posts" on public.community_posts for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "users delete community posts" on public.community_posts for delete to authenticated using(user_id=(select auth.uid()));
create policy "community likes are public" on public.community_post_likes for select to anon,authenticated using(true);
create policy "users manage community likes" on public.community_post_likes for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create index community_posts_feed_idx on public.community_posts(parent_id,created_at desc);
