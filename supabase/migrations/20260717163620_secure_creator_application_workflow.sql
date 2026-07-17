-- Creator applications are mutated only through authenticated server routes.
-- This prevents applicants from promoting themselves or writing review fields
-- directly through the Data API.
revoke insert, update on public.creator_applications from authenticated;

drop policy if exists "users create own creator application" on public.creator_applications;
drop policy if exists "users update draft creator application" on public.creator_applications;

create index if not exists creator_teams_created_by_idx
  on public.creator_teams(created_by, created_at desc);
