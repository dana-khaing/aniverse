create table public.creator_team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.creator_teams(id) on delete cascade,
  email text not null,
  role public.team_role not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(team_id,email)
);

alter table public.creator_team_invitations enable row level security;
revoke all on public.creator_team_invitations from anon, authenticated;
create index creator_team_invitations_email_idx on public.creator_team_invitations(lower(email),expires_at) where accepted_at is null;
