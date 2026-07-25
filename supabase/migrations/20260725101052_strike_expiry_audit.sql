alter table public.creator_strikes
  add column expired_at timestamptz,
  add constraint creator_strikes_expiry_order
    check (expires_at is null or expires_at > created_at);

create index creator_strikes_expiring_idx
  on public.creator_strikes(expires_at)
  where revoked_at is null and expired_at is null and expires_at is not null;

create index audit_logs_entity_created_idx
  on public.audit_logs(entity_type, entity_id, created_at desc);

create index audit_logs_action_created_idx
  on public.audit_logs(action, created_at desc);

create or replace function public.expire_creator_strikes()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expired_count integer := 0;
begin
  with expired as (
    update public.creator_strikes
    set expired_at = now()
    where revoked_at is null
      and expired_at is null
      and expires_at <= now()
    returning id, creator_id, expires_at
  ),
  logged as (
    insert into public.audit_logs (
      actor_id, action, entity_type, entity_id, metadata
    )
    select
      null,
      'creator_strike.expired',
      'creator_strike',
      id::text,
      jsonb_build_object(
        'creator_id', creator_id,
        'scheduled_expiry', expires_at,
        'source', 'automated_expiry'
      )
    from expired
    returning 1
  )
  select count(*) into expired_count from logged;
  return expired_count;
end;
$$;

revoke execute on function public.expire_creator_strikes() from public, anon, authenticated;
grant execute on function public.expire_creator_strikes() to service_role;
