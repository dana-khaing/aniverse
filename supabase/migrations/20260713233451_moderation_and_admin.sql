create type public.moderation_status as enum ('open', 'reviewing', 'actioned', 'dismissed', 'appealed', 'closed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('title', 'episode', 'comment', 'profile')),
  entity_id uuid not null,
  reason text not null,
  details text check (char_length(details) <= 2000),
  status public.moderation_status not null default 'open',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.takedowns (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles(id) on delete cascade,
  claimant_name text not null,
  claimant_email text not null,
  rights_basis text not null,
  status public.moderation_status not null default 'open',
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.creator_strikes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  reason text not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  strike_id uuid not null references public.creator_strikes(id) on delete cascade,
  appellant_id uuid not null references auth.users(id) on delete cascade,
  statement text not null check (char_length(statement) between 20 and 4000),
  status public.moderation_status not null default 'appealed',
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.reports enable row level security;
alter table public.takedowns enable row level security;
alter table public.creator_strikes enable row level security;
alter table public.appeals enable row level security;

grant select, insert, update on public.reports, public.appeals to authenticated;
grant select, insert, update on public.takedowns, public.creator_strikes to authenticated;

create policy "reporters create reports" on public.reports for insert to authenticated with check (reporter_id=(select auth.uid()));
create policy "reporters read reports" on public.reports for select to authenticated using (reporter_id=(select auth.uid()) or exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin')));
create policy "moderators manage reports" on public.reports for all to authenticated using (exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin'))) with check (exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin')));
create policy "creators read strikes" on public.creator_strikes for select to authenticated using (creator_id=(select auth.uid()) or exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin')));
create policy "moderators manage strikes" on public.creator_strikes for all to authenticated using (exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin'))) with check (exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin')));
create policy "moderators manage takedowns" on public.takedowns for all to authenticated using (exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin'))) with check (exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin')));
create policy "creators submit appeals" on public.appeals for insert to authenticated with check (appellant_id=(select auth.uid()));
create policy "creators read appeals" on public.appeals for select to authenticated using (appellant_id=(select auth.uid()) or exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin')));
create policy "moderators manage appeals" on public.appeals for all to authenticated using (exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin'))) with check (exists (select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('moderator','admin')));

create index reports_queue_idx on public.reports(status, created_at);
create index takedowns_queue_idx on public.takedowns(status, created_at);
create index creator_strikes_active_idx on public.creator_strikes(creator_id, created_at desc) where revoked_at is null;
create index appeals_queue_idx on public.appeals(status, created_at);
