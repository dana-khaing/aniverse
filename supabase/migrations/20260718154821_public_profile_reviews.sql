create table public.profile_reviews(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title_id uuid references public.titles(id) on delete set null,title_name text not null,body text not null check(char_length(body) between 20 and 2000),score smallint not null check(score between 1 and 10),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.profile_reviews enable row level security;
grant select on public.profile_reviews to anon,authenticated;
grant insert,update,delete on public.profile_reviews to authenticated;
create policy "public profile reviews are readable" on public.profile_reviews for select to anon,authenticated using(exists(select 1 from public.profiles where id=user_id and profile_public));
create policy "users create profile reviews" on public.profile_reviews for insert to authenticated with check(user_id=(select auth.uid()));
create policy "users update profile reviews" on public.profile_reviews for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "users delete profile reviews" on public.profile_reviews for delete to authenticated using(user_id=(select auth.uid()));
create index profile_reviews_user_created_idx on public.profile_reviews(user_id,created_at desc);
