create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('account', 'playback', 'creator', 'billing', 'safety', 'other')),
  subject text not null check (char_length(subject) between 5 and 160),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.support_ticket_messages (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 5000),
  staff_note boolean not null default false,
  attachment_name text check (attachment_name is null or char_length(attachment_name) <= 200),
  attachment_path text,
  created_at timestamptz not null default now()
);

create table public.status_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 160),
  body text not null check (char_length(body) between 10 and 5000),
  severity text not null check (severity in ('maintenance', 'minor', 'major', 'critical')),
  status text not null check (status in ('investigating', 'identified', 'monitoring', 'resolved')),
  affected_services text[] not null default '{}',
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.status_incidents enable row level security;

grant select, insert, update on public.support_tickets to authenticated;
grant select, insert on public.support_ticket_messages to authenticated;
grant usage, select on sequence public.support_ticket_messages_id_seq to authenticated;
grant select on public.status_incidents to anon, authenticated;

create policy "users read own support tickets"
  on public.support_tickets for select to authenticated
  using (user_id = (select auth.uid()));
create policy "users create own support tickets"
  on public.support_tickets for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and assigned_to is null
    and status = 'open'
    and priority = 'normal'
  );
create policy "users update waiting support tickets"
  on public.support_tickets for update to authenticated
  using (user_id = (select auth.uid()) and status = 'waiting_on_user')
  with check (
    user_id = (select auth.uid())
    and status = 'open'
    and priority = 'normal'
    and assigned_to is null
  );

create policy "users read own public support messages"
  on public.support_ticket_messages for select to authenticated
  using (
    not staff_note
    and exists (
      select 1 from public.support_tickets
      where support_tickets.id = ticket_id
        and support_tickets.user_id = (select auth.uid())
    )
  );
create policy "users reply to own active tickets"
  on public.support_ticket_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not staff_note
    and exists (
      select 1 from public.support_tickets
      where support_tickets.id = ticket_id
        and support_tickets.user_id = (select auth.uid())
        and support_tickets.status in ('open', 'in_progress', 'waiting_on_user')
    )
  );

create policy "published status incidents are public"
  on public.status_incidents for select to anon, authenticated
  using (published);

create index support_tickets_user_updated_idx
  on public.support_tickets(user_id, updated_at desc);
create index support_tickets_queue_idx
  on public.support_tickets(status, priority, updated_at desc);
create index support_ticket_messages_ticket_created_idx
  on public.support_ticket_messages(ticket_id, created_at);
create index status_incidents_public_updated_idx
  on public.status_incidents(updated_at desc)
  where published;
