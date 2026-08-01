create table public.library_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version bigint not null default 0,
  last_operation_id uuid,
  updated_at timestamptz not null default now()
);
alter table public.library_sync_state enable row level security;
grant select on public.library_sync_state to authenticated;
create policy "users read library sync state" on public.library_sync_state
for select to authenticated using (user_id=(select auth.uid()));

create or replace function public.claim_library_sync(p_base_version bigint,p_operation_id uuid)
returns bigint language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); state public.library_sync_state%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  insert into public.library_sync_state(user_id) values(actor) on conflict do nothing;
  select * into state from public.library_sync_state where user_id=actor for update;
  if state.last_operation_id=p_operation_id then return state.version; end if;
  if state.version<>p_base_version then raise exception 'library_conflict'; end if;
  update public.library_sync_state set version=version+1,last_operation_id=p_operation_id,updated_at=now() where user_id=actor returning version into state.version;
  return state.version;
end $$;
revoke execute on function public.claim_library_sync(bigint,uuid) from public,anon;
grant execute on function public.claim_library_sync(bigint,uuid) to authenticated;
