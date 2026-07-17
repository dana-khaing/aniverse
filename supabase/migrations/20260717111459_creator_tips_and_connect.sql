alter table public.creator_teams
  add column stripe_account_id text unique,
  add column stripe_details_submitted boolean not null default false,
  add column stripe_charges_enabled boolean not null default false,
  add column stripe_payouts_enabled boolean not null default false;

create table public.creator_tips (
  id uuid primary key default gen_random_uuid(),
  supporter_user_id uuid references auth.users(id) on delete set null,
  creator_team_id uuid not null references public.creator_teams(id) on delete restrict,
  title_id uuid references public.titles(id) on delete set null,
  amount_minor integer not null check (amount_minor between 100 and 100000),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  platform_fee_minor integer not null default 0 check (platform_fee_minor = 0),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  status text not null default 'checkout' check (status in ('checkout','pending','paid','failed','refunded')),
  supporter_name text check (char_length(supporter_name) between 1 and 60),
  message text check (char_length(message) <= 280),
  is_public boolean not null default true,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

alter table public.creator_tips enable row level security;
alter table public.stripe_webhook_events enable row level security;

grant select on public.creator_tips to anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;

create policy "public tips are visible"
on public.creator_tips for select to anon, authenticated
using (status = 'paid' and is_public = true);

create policy "supporters read their tips"
on public.creator_tips for select to authenticated
using (supporter_user_id = (select auth.uid()));

create policy "creator teams read received tips"
on public.creator_tips for select to authenticated
using (
  creator_team_id in (
    select team_id from public.creator_team_memberships
    where user_id = (select auth.uid())
  )
);

create index creator_tips_team_status_idx
  on public.creator_tips(creator_team_id, status, created_at desc);
create index creator_tips_supporter_idx
  on public.creator_tips(supporter_user_id, created_at desc)
  where supporter_user_id is not null;
create index creator_tips_title_idx
  on public.creator_tips(title_id, created_at desc)
  where title_id is not null and status = 'paid';
create index stripe_webhook_events_processed_idx
  on public.stripe_webhook_events(processed_at desc);
