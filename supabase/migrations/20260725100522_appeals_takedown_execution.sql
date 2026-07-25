alter table public.takedowns
  add column original_title_status public.title_status,
  add column execution_notes text check (char_length(execution_notes) <= 2000),
  add column executed_at timestamptz,
  add column restored_at timestamptz;

alter table public.creator_strikes
  add column takedown_id uuid references public.takedowns(id) on delete set null;

alter table public.appeals
  add column outcome text check (outcome in ('approved', 'denied')),
  add column remediation jsonb not null default '{}'::jsonb;

create or replace function public.execute_title_takedown(
  target_takedown_id uuid,
  reviewer_id uuid,
  notes text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_title_id uuid;
  previous_status public.title_status;
begin
  select title_id into target_title_id
  from public.takedowns
  where id = target_takedown_id
    and status in ('open', 'reviewing')
  for update;
  if target_title_id is null then
    raise exception 'Takedown is unavailable';
  end if;

  select status into previous_status
  from public.titles
  where id = target_title_id
  for update;

  update public.titles
  set status = 'removed', updated_at = now()
  where id = target_title_id;

  update public.takedowns
  set status = 'actioned',
      reviewed_by = reviewer_id,
      original_title_status = previous_status,
      execution_notes = nullif(notes, ''),
      executed_at = now(),
      resolved_at = now()
  where id = target_takedown_id;
end;
$$;

create or replace function public.resolve_creator_appeal(
  target_appeal_id uuid,
  reviewer_id uuid,
  decision text,
  notes text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_strike_id uuid;
  target_takedown_id uuid;
  target_title_id uuid;
  prior_status public.title_status;
begin
  if decision not in ('approved', 'denied') then
    raise exception 'Invalid appeal decision';
  end if;

  select strike_id into target_strike_id
  from public.appeals
  where id = target_appeal_id and status = 'appealed'
  for update;
  if target_strike_id is null then
    raise exception 'Appeal is unavailable';
  end if;

  if decision = 'approved' then
    update public.creator_strikes
    set revoked_at = now()
    where id = target_strike_id
    returning takedown_id into target_takedown_id;

    if target_takedown_id is not null then
      select title_id, original_title_status
      into target_title_id, prior_status
      from public.takedowns
      where id = target_takedown_id
      for update;

      update public.titles
      set status = coalesce(prior_status, 'unpublished'), updated_at = now()
      where id = target_title_id;

      update public.takedowns
      set status = 'closed', restored_at = now()
      where id = target_takedown_id;
    end if;
  end if;

  update public.appeals
  set status = 'closed',
      outcome = decision,
      reviewed_by = reviewer_id,
      review_notes = nullif(notes, ''),
      remediation = jsonb_build_object(
        'strike_revoked', decision = 'approved',
        'title_restored', decision = 'approved' and target_takedown_id is not null
      ),
      resolved_at = now()
  where id = target_appeal_id;
end;
$$;

revoke execute on function public.execute_title_takedown(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.resolve_creator_appeal(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.execute_title_takedown(uuid, uuid, text) to service_role;
grant execute on function public.resolve_creator_appeal(uuid, uuid, text, text) to service_role;

create index creator_strikes_takedown_idx
  on public.creator_strikes(takedown_id)
  where takedown_id is not null;
