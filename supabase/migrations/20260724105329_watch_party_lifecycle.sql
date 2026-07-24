alter table public.watch_parties
  add column invite_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  add column updated_at timestamptz not null default now(),
  add constraint watch_parties_invite_code_unique unique(invite_code);

create table public.watch_party_invitations (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.watch_parties(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null default 'viewer' check (role in ('moderator', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table public.watch_party_invitations enable row level security;
grant select, insert, update, delete on public.watch_party_invitations to authenticated;

create policy "hosts and moderators read invitations"
on public.watch_party_invitations for select to authenticated
using (
  exists (
    select 1 from public.watch_parties
    where id = watch_party_invitations.party_id
      and host_id = (select auth.uid())
  )
  or
  exists (
    select 1 from public.watch_party_members
    where party_id = watch_party_invitations.party_id
      and user_id = (select auth.uid())
      and role in ('host', 'moderator')
  )
);

create policy "hosts and moderators create invitations"
on public.watch_party_invitations for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and (
    exists (
      select 1 from public.watch_parties
      where id = watch_party_invitations.party_id
        and host_id = (select auth.uid())
    )
    or exists (
    select 1 from public.watch_party_members
    where party_id = watch_party_invitations.party_id
      and user_id = (select auth.uid())
      and role in ('host', 'moderator')
    )
  )
);

create policy "hosts manage invitations"
on public.watch_party_invitations for update to authenticated
using (
  exists (
    select 1 from public.watch_parties
    where id = watch_party_invitations.party_id
      and host_id = (select auth.uid())
  )
);

create index watch_party_invitations_party_pending_idx
  on public.watch_party_invitations(party_id, created_at desc)
  where status = 'pending';

create index watch_party_invitations_email_pending_idx
  on public.watch_party_invitations(lower(email), expires_at)
  where status = 'pending';
