create table public.media_webhook_events (
  event_id text primary key,
  event_type text not null,
  provider text not null default 'mux' check (provider in ('mux')),
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

alter table public.media_webhook_events enable row level security;
revoke all on public.media_webhook_events from anon, authenticated;

create index media_webhook_events_processed_idx
  on public.media_webhook_events(processed_at desc);
