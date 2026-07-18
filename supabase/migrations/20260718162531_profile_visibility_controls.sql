alter table public.profiles add column profile_visibility text not null default 'public' check(profile_visibility in('public','followers','private'));
alter table public.profiles add column show_activity boolean not null default true;
drop policy if exists "public profiles are readable" on public.profiles;
create policy "visible profiles are readable" on public.profiles for select to anon,authenticated using(id=(select auth.uid()) or profile_visibility='public' or(profile_visibility='followers' and exists(select 1 from public.creator_follows where creator_id=profiles.id and follower_id=(select auth.uid()))));
create index profiles_visibility_idx on public.profiles(profile_visibility) where profile_visibility<>'private';
