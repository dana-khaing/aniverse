alter table public.notification_events
  alter column user_id drop not null,
  add column recipient_email text
    check (recipient_email is null or char_length(recipient_email) between 5 and 320),
  add column locked_at timestamptz,
  add column locked_by uuid,
  drop constraint notification_events_status_check,
  add constraint notification_events_status_check
    check (status in (
      'pending', 'processing', 'delivered', 'partial', 'failed', 'dead_letter'
    )),
  add constraint notification_events_recipient_check
    check (user_id is not null or recipient_email is not null);

drop index public.notification_events_pending_idx;
create index notification_events_pending_idx
  on public.notification_events(available_at, created_at)
  where status in ('pending', 'failed') and attempts < 10;
create index notification_events_stale_claim_idx
  on public.notification_events(locked_at)
  where status = 'processing';

create or replace function public.claim_notification_events(
  batch_size integer,
  worker_id uuid
)
returns setof public.notification_events
language sql
security invoker
set search_path = ''
as $$
  with eligible as (
    select id
    from public.notification_events
    where (
      status in ('pending', 'failed')
      and attempts < 10
      and available_at <= now()
    ) or (
      status = 'processing'
      and locked_at < now() - interval '15 minutes'
      and attempts < 10
    )
    order by available_at, created_at
    for update skip locked
    limit least(greatest(batch_size, 1), 100)
  )
  update public.notification_events as event
  set status = 'processing',
      attempts = event.attempts + 1,
      locked_at = now(),
      locked_by = worker_id,
      last_error = case
        when event.status = 'processing' then 'Recovered stale worker claim'
        else event.last_error
      end
  from eligible
  where event.id = eligible.id
  returning event.*;
$$;

create or replace function public.replay_notification_event(
  target_event_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.notification_deliveries where event_id = target_event_id;
  update public.notification_events
  set status = 'pending',
      attempts = 0,
      available_at = now(),
      processed_at = null,
      last_error = null,
      locked_at = null,
      locked_by = null
  where id = target_event_id
    and status in ('failed', 'partial', 'dead_letter');
  if not found then raise exception 'Notification event is not replayable'; end if;
end;
$$;

revoke execute on function public.claim_notification_events(integer, uuid)
  from public, anon, authenticated;
revoke execute on function public.replay_notification_event(uuid)
  from public, anon, authenticated;
grant execute on function public.claim_notification_events(integer, uuid)
  to service_role;
grant execute on function public.replay_notification_event(uuid)
  to service_role;
