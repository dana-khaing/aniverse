create table public.consent_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms', 'privacy', 'playback_analytics', 'marketing')),
  document_version text not null check (char_length(document_version) between 1 and 40),
  granted boolean not null,
  source text not null check (source in ('signup', 'account_settings', 'migration')),
  recorded_at timestamptz not null default now()
);

create table public.dmca_requests (
  id uuid primary key default gen_random_uuid(),
  claimant_name text not null check (char_length(claimant_name) between 2 and 120),
  claimant_email text not null check (char_length(claimant_email) between 5 and 320),
  organization text check (organization is null or char_length(organization) <= 160),
  work_description text not null check (char_length(work_description) between 30 and 5000),
  material_urls text[] not null check (cardinality(material_urls) between 1 and 20),
  good_faith_confirmed boolean not null check (good_faith_confirmed),
  accuracy_confirmed boolean not null check (accuracy_confirmed),
  signature text not null check (char_length(signature) between 2 and 120),
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'actioned', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

alter table public.consent_records enable row level security;
alter table public.dmca_requests enable row level security;

grant select, insert on public.consent_records to authenticated;
create policy "users read own consent history"
  on public.consent_records for select to authenticated
  using (user_id = (select auth.uid()));
create policy "users append own consent records"
  on public.consent_records for insert to authenticated
  with check (user_id = (select auth.uid()));

create index consent_records_user_type_recorded_idx
  on public.consent_records(user_id, consent_type, recorded_at desc);
create index dmca_requests_status_submitted_idx
  on public.dmca_requests(status, submitted_at);

create or replace function public.record_signup_legal_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((new.raw_user_meta_data ->> 'legal_consent')::boolean, false) then
    insert into public.consent_records(user_id, consent_type, document_version, granted, source)
    values
      (new.id, 'terms', coalesce(new.raw_user_meta_data ->> 'terms_version', '2026-07-27'), true, 'signup'),
      (new.id, 'privacy', coalesce(new.raw_user_meta_data ->> 'privacy_version', '2026-07-27'), true, 'signup');
  end if;
  return new;
end;
$$;

revoke execute on function public.record_signup_legal_consent()
  from public, anon, authenticated;
create trigger record_signup_legal_consent
  after insert on auth.users
  for each row execute procedure public.record_signup_legal_consent();
