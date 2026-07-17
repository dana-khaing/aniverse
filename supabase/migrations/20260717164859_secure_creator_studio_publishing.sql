-- Creator teams are provisioned by the application approval service. Keep the
-- tables readable through RLS, but require all mutations to pass through a
-- server route that verifies the caller's team role.
revoke insert, update on public.creator_teams from authenticated;
revoke insert, update, delete on public.creator_team_memberships from authenticated;

drop policy if exists "creators make teams" on public.creator_teams;
drop policy if exists "team owners update teams" on public.creator_teams;
drop policy if exists "team creators add initial members" on public.creator_team_memberships;

create index if not exists titles_creator_team_created_idx
  on public.titles(creator_team_id, created_at desc);

create index if not exists seasons_title_number_idx
  on public.seasons(title_id, number);
