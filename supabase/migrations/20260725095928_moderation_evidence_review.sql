create table public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('image', 'video', 'document', 'link', 'statement')),
  source_url text check (source_url is null or source_url ~ '^https://'),
  description text not null check (char_length(description) between 1 and 2000),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  review_status text not null default 'pending' check (review_status in ('pending', 'verified', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text check (char_length(review_notes) <= 2000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.report_evidence enable row level security;
grant select, insert, update on public.report_evidence to authenticated;

create policy "report participants submit evidence"
on public.report_evidence for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and exists (
    select 1 from public.reports
    where reports.id = report_id
      and reports.reporter_id = (select auth.uid())
      and reports.status in ('open', 'reviewing', 'appealed')
  )
);

create policy "report participants read evidence"
on public.report_evidence for select to authenticated
using (
  submitted_by = (select auth.uid())
  or exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('moderator', 'admin')
  )
);

create policy "moderators review evidence"
on public.report_evidence for update to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('moderator', 'admin')
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('moderator', 'admin')
  )
);

create index report_evidence_queue_idx
  on public.report_evidence(review_status, created_at);

create index report_evidence_report_idx
  on public.report_evidence(report_id, created_at);
