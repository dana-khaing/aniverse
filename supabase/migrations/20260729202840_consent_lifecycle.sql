alter table public.consent_records
  drop constraint consent_records_source_check,
  add constraint consent_records_source_check
    check (source in (
      'signup', 'oauth_signup', 'account_settings', 'version_gate', 'migration'
    ));

create table public.consent_withdrawal_records (
  id bigint generated always as identity primary key,
  user_id_hash text not null check (char_length(user_id_hash) = 64),
  document_version text not null check (char_length(document_version) between 1 and 40),
  withdrawal_method text not null check (withdrawal_method = 'account_deletion'),
  withdrawn_at timestamptz not null default now()
);

alter table public.consent_withdrawal_records enable row level security;

create index consent_withdrawal_records_hash_time_idx
  on public.consent_withdrawal_records(user_id_hash, withdrawn_at desc);
