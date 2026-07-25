alter table public.notification_preferences
  add column push_enabled boolean not null default true;

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('release', 'community', 'moderation', 'creator')),
  event_key text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  href text check (href is null or href like '/%'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'delivered', 'partial', 'failed')),
  attempts smallint not null default 0 check (attempts between 0 and 10),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events(id) on delete cascade,
  channel text not null check (channel in ('email', 'push')),
  status text not null check (status in ('delivered', 'skipped', 'failed')),
  provider_id text,
  detail text,
  created_at timestamptz not null default now(),
  unique (event_id, channel)
);

alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;

grant select on public.notification_events, public.notification_deliveries to authenticated;

create policy "users read their notification events"
on public.notification_events for select to authenticated
using (user_id = (select auth.uid()));

create policy "users read their notification deliveries"
on public.notification_deliveries for select to authenticated
using (
  exists (
    select 1 from public.notification_events
    where notification_events.id = event_id
      and notification_events.user_id = (select auth.uid())
  )
);

create index notification_events_pending_idx
  on public.notification_events(available_at, created_at)
  where status in ('pending', 'failed') and attempts < 10;

create index notification_events_user_idx
  on public.notification_events(user_id, created_at desc);

create or replace function public.enqueue_notification_delivery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_category text;
begin
  notification_category := case
    when new.type in ('release', 'premiere', 'episode') then 'release'
    when new.type in ('reply', 'reaction', 'follow') then 'community'
    when new.type in ('moderation', 'appeal', 'strike', 'takedown') then 'moderation'
    else 'creator'
  end;

  insert into public.notification_events (
    user_id, category, event_key, title, body, href
  ) values (
    new.user_id,
    notification_category,
    'notification:' || new.id::text,
    new.title,
    new.body,
    new.href
  ) on conflict (event_key) do nothing;
  return new;
end;
$$;

revoke execute on function public.enqueue_notification_delivery() from public, anon, authenticated;

create trigger enqueue_notification_delivery
after insert on public.notifications
for each row execute procedure public.enqueue_notification_delivery();
