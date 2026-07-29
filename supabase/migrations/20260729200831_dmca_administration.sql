alter table public.dmca_requests
  add column title_id uuid references public.titles(id) on delete set null,
  add column review_notes text check (review_notes is null or char_length(review_notes) <= 2000),
  add column actioned_at timestamptz;

create table public.dmca_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.dmca_requests(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'submitted', 'review_started', 'note_added', 'rejected',
    'takedown_executed', 'counter_notice_submitted'
  )),
  notes text check (notes is null or char_length(notes) <= 2000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.dmca_counter_notices (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.dmca_requests(id) on delete cascade,
  submitter_id uuid not null references auth.users(id) on delete cascade,
  contact_email text not null check (char_length(contact_email) between 5 and 320),
  statement text not null check (char_length(statement) between 30 and 5000),
  good_faith_confirmed boolean not null check (good_faith_confirmed),
  jurisdiction_confirmed boolean not null check (jurisdiction_confirmed),
  signature text not null check (char_length(signature) between 2 and 120),
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewing', 'accepted', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text check (review_notes is null or char_length(review_notes) <= 2000),
  unique (request_id, submitter_id)
);

alter table public.dmca_request_events enable row level security;
alter table public.dmca_counter_notices enable row level security;

grant select, insert on public.dmca_counter_notices to authenticated;

create policy "affected creators read counter notices"
  on public.dmca_counter_notices for select to authenticated
  using (
    submitter_id = (select auth.uid())
    and exists (
      select 1
      from public.dmca_requests
      join public.titles on titles.id = dmca_requests.title_id
      join public.creator_team_memberships
        on creator_team_memberships.team_id = titles.creator_team_id
      where dmca_requests.id = dmca_counter_notices.request_id
        and creator_team_memberships.user_id = (select auth.uid())
    )
  );

create policy "affected creators submit counter notices"
  on public.dmca_counter_notices for insert to authenticated
  with check (
    submitter_id = (select auth.uid())
    and exists (
      select 1
      from public.dmca_requests
      join public.titles on titles.id = dmca_requests.title_id
      join public.creator_team_memberships
        on creator_team_memberships.team_id = titles.creator_team_id
      where dmca_requests.id = dmca_counter_notices.request_id
        and creator_team_memberships.user_id = (select auth.uid())
        and creator_team_memberships.role in ('owner', 'editor')
    )
  );

create or replace function public.review_dmca_request(
  target_request_id uuid,
  reviewer_id uuid,
  decision text,
  notes text,
  target_title_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if decision not in ('reviewing', 'rejected') then
    raise exception 'Invalid DMCA decision';
  end if;

  update public.dmca_requests
  set status = decision,
      title_id = coalesce(target_title_id, title_id),
      review_notes = nullif(notes, ''),
      reviewed_by = reviewer_id,
      reviewed_at = now()
  where id = target_request_id
    and status in ('submitted', 'reviewing');
  if not found then raise exception 'DMCA request is unavailable'; end if;

  insert into public.dmca_request_events(request_id, actor_id, event_type, notes)
  values (
    target_request_id,
    reviewer_id,
    case when decision = 'rejected' then 'rejected' else 'review_started' end,
    nullif(notes, '')
  );
end;
$$;

create or replace function public.execute_dmca_takedown(
  target_request_id uuid,
  reviewer_id uuid,
  notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_title_id uuid;
  generated_takedown_id uuid;
  request_claimant_name text;
  request_claimant_email text;
  request_rights_basis text;
begin
  select title_id, claimant_name, claimant_email, work_description
  into target_title_id, request_claimant_name, request_claimant_email, request_rights_basis
  from public.dmca_requests
  where id = target_request_id and status in ('submitted', 'reviewing')
  for update;
  if target_title_id is null then raise exception 'A title must be linked before execution'; end if;

  insert into public.takedowns(title_id, claimant_name, claimant_email, rights_basis, reviewed_by)
  values (
    target_title_id, request_claimant_name, request_claimant_email,
    request_rights_basis, reviewer_id
  )
  returning id into generated_takedown_id;

  perform public.execute_title_takedown(generated_takedown_id, reviewer_id, notes);

  update public.dmca_requests
  set status = 'actioned',
      review_notes = nullif(notes, ''),
      reviewed_by = reviewer_id,
      reviewed_at = now(),
      actioned_at = now()
  where id = target_request_id;

  insert into public.dmca_request_events(
    request_id, actor_id, event_type, notes, metadata
  )
  values (
    target_request_id, reviewer_id, 'takedown_executed', nullif(notes, ''),
    jsonb_build_object('takedown_id', generated_takedown_id, 'title_id', target_title_id)
  );
  return generated_takedown_id;
end;
$$;

revoke execute on function public.review_dmca_request(uuid, uuid, text, text, uuid)
  from public, anon, authenticated;
revoke execute on function public.execute_dmca_takedown(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.review_dmca_request(uuid, uuid, text, text, uuid)
  to service_role;
grant execute on function public.execute_dmca_takedown(uuid, uuid, text)
  to service_role;

create index dmca_requests_title_status_idx
  on public.dmca_requests(title_id, status, submitted_at desc)
  where title_id is not null;
create index dmca_request_events_request_created_idx
  on public.dmca_request_events(request_id, created_at);
create index dmca_counter_notices_queue_idx
  on public.dmca_counter_notices(status, submitted_at);
