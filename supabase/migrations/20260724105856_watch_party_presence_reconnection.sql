alter table public.watch_party_members
  add column last_seen_at timestamptz not null default now(),
  add column connection_state text not null default 'offline'
    check (connection_state in ('online', 'away', 'offline')),
  add column reconnect_count integer not null default 0 check (reconnect_count >= 0);

create index watch_party_members_presence_idx
  on public.watch_party_members(party_id, connection_state, last_seen_at desc);

create policy "members update their own presence"
on public.watch_party_members for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
