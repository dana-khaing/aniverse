create table public.user_account_controls (
  user_id uuid primary key references auth.users(id) on delete cascade,
  suspended_at timestamptz,
  suspended_by uuid references auth.users(id) on delete set null,
  suspension_reason text check (suspension_reason is null or char_length(suspension_reason) between 10 and 500),
  updated_at timestamptz not null default now(),
  check (
    (suspended_at is null and suspended_by is null and suspension_reason is null)
    or
    (suspended_at is not null and suspension_reason is not null)
  )
);

create table public.user_access_history (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('role_granted', 'role_revoked', 'account_suspended', 'account_restored')),
  role public.app_role,
  reason text not null check (char_length(reason) between 10 and 500),
  created_at timestamptz not null default now(),
  check (
    (action in ('role_granted', 'role_revoked') and role is not null)
    or
    (action in ('account_suspended', 'account_restored') and role is null)
  )
);

alter table public.user_account_controls enable row level security;
alter table public.user_access_history enable row level security;

create policy "admins read account controls" on public.user_account_controls
  for select to authenticated
  using (exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  ));

create policy "admins read access history" on public.user_access_history
  for select to authenticated
  using (exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  ));

grant select on public.user_account_controls, public.user_access_history to authenticated;

create index user_roles_role_user_idx on public.user_roles(role, user_id);
create index user_account_controls_suspended_idx
  on public.user_account_controls(suspended_at desc)
  where suspended_at is not null;
create index user_access_history_user_created_idx
  on public.user_access_history(user_id, created_at desc);

create or replace function public.manage_user_access(
  p_actor_id uuid,
  p_user_id uuid,
  p_action text,
  p_reason text,
  p_role public.app_role default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_count integer;
begin
  if p_actor_id is null or p_user_id is null then
    raise exception 'Actor and user are required';
  end if;
  if not exists (
    select 1 from public.user_roles
    where user_id = p_actor_id and role = 'admin'
  ) then
    raise exception 'Administrator access required';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 10 then
    raise exception 'A reason of at least 10 characters is required';
  end if;

  if p_action = 'grant_role' then
    if p_role is null then raise exception 'Role is required'; end if;
    insert into public.user_roles(user_id, role, granted_by)
      values (p_user_id, p_role, p_actor_id)
      on conflict (user_id, role) do nothing;
    insert into public.user_access_history(actor_id, user_id, action, role, reason)
      values (p_actor_id, p_user_id, 'role_granted', p_role, trim(p_reason));

  elsif p_action = 'revoke_role' then
    if p_role is null or p_role = 'viewer' then
      raise exception 'The baseline viewer role cannot be revoked';
    end if;
    if p_actor_id = p_user_id and p_role = 'admin' then
      raise exception 'Administrators cannot revoke their own access';
    end if;
    if p_role = 'admin' then
      select count(*) into v_admin_count from public.user_roles where role = 'admin';
      if v_admin_count <= 1 then raise exception 'The last administrator cannot be removed'; end if;
    end if;
    delete from public.user_roles where user_id = p_user_id and role = p_role;
    insert into public.user_access_history(actor_id, user_id, action, role, reason)
      values (p_actor_id, p_user_id, 'role_revoked', p_role, trim(p_reason));

  elsif p_action = 'suspend' then
    if p_actor_id = p_user_id then raise exception 'Administrators cannot suspend themselves'; end if;
    if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'admin') then
      select count(*) into v_admin_count from public.user_roles where role = 'admin';
      if v_admin_count <= 1 then raise exception 'The last administrator cannot be suspended'; end if;
    end if;
    insert into public.user_account_controls(user_id, suspended_at, suspended_by, suspension_reason, updated_at)
      values (p_user_id, now(), p_actor_id, trim(p_reason), now())
      on conflict (user_id) do update set
        suspended_at = excluded.suspended_at,
        suspended_by = excluded.suspended_by,
        suspension_reason = excluded.suspension_reason,
        updated_at = excluded.updated_at;
    insert into public.user_access_history(actor_id, user_id, action, reason)
      values (p_actor_id, p_user_id, 'account_suspended', trim(p_reason));

  elsif p_action = 'restore' then
    insert into public.user_account_controls(user_id, suspended_at, suspended_by, suspension_reason, updated_at)
      values (p_user_id, null, null, null, now())
      on conflict (user_id) do update set
        suspended_at = null,
        suspended_by = null,
        suspension_reason = null,
        updated_at = excluded.updated_at;
    insert into public.user_access_history(actor_id, user_id, action, reason)
      values (p_actor_id, p_user_id, 'account_restored', trim(p_reason));
  else
    raise exception 'Unsupported access action';
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values (
      p_actor_id,
      'admin.user_access.' || p_action,
      'user',
      p_user_id::text,
      jsonb_build_object('role', p_role, 'reason', trim(p_reason))
    );
end;
$$;

revoke execute on function public.manage_user_access(uuid, uuid, text, text, public.app_role)
  from public, anon, authenticated;
grant execute on function public.manage_user_access(uuid, uuid, text, text, public.app_role)
  to service_role;
