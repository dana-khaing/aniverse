drop policy if exists "community posts are public" on public.community_posts;
create policy "community posts respect blocks"
on public.community_posts for select to anon, authenticated
using (
  (select auth.uid()) is null
  or user_id = (select auth.uid())
  or not exists (
    select 1 from public.blocked_users
    where (blocker_id = (select auth.uid()) and blocked_id = community_posts.user_id)
       or (blocker_id = community_posts.user_id and blocked_id = (select auth.uid()))
  )
);

drop policy if exists "community likes are public" on public.community_post_likes;
create policy "community likes respect blocks"
on public.community_post_likes for select to anon, authenticated
using (
  (select auth.uid()) is null
  or user_id = (select auth.uid())
  or not exists (
    select 1 from public.blocked_users
    where (blocker_id = (select auth.uid()) and blocked_id = community_post_likes.user_id)
       or (blocker_id = community_post_likes.user_id and blocked_id = (select auth.uid()))
  )
);

drop policy if exists "comments are public" on public.comments;
create policy "comments respect blocks"
on public.comments for select to anon, authenticated
using (
  deleted_at is null and (
    (select auth.uid()) is null
    or user_id = (select auth.uid())
    or not exists (
      select 1 from public.blocked_users
      where (blocker_id = (select auth.uid()) and blocked_id = comments.user_id)
         or (blocker_id = comments.user_id and blocked_id = (select auth.uid()))
    )
  )
);

drop policy if exists "reactions are public" on public.comment_reactions;
create policy "reactions respect blocks"
on public.comment_reactions for select to anon, authenticated
using (
  (select auth.uid()) is null
  or user_id = (select auth.uid())
  or not exists (
    select 1 from public.blocked_users
    where (blocker_id = (select auth.uid()) and blocked_id = comment_reactions.user_id)
       or (blocker_id = comment_reactions.user_id and blocked_id = (select auth.uid()))
  )
);

create index if not exists blocked_users_reverse_idx on public.blocked_users(blocked_id, blocker_id);
