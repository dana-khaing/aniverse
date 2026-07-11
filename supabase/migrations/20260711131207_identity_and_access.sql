create type public.app_role as enum ('viewer', 'creator', 'moderator', 'admin');
create type public.creator_application_status as enum ('draft', 'submitted', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-zA-Z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 80),
  bio text check (char_length(bio) <= 500),
  avatar_path text,
  date_of_birth date,
  mature_content_enabled boolean not null default false,
  profile_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'viewer',
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  release_email boolean not null default true,
  community_email boolean not null default true,
  creator_email boolean not null default true,
  in_app_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.blocked_users (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status public.creator_application_status not null default 'draft',
  legal_name text not null default '',
  channel_name text not null default '',
  portfolio_url text,
  rights_summary text not null default '',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'viewer');
  if lower(new.email) = 'lewisdana04@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.blocked_users enable row level security;
alter table public.creator_applications enable row level security;
alter table public.audit_logs enable row level security;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, update on public.notification_preferences to authenticated;
grant select, insert, delete on public.blocked_users to authenticated;
grant select, insert, update on public.creator_applications to authenticated;

create policy "public profiles are readable" on public.profiles for select to anon, authenticated using (profile_public or id = (select auth.uid()));
create policy "users update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "users read own roles" on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
create policy "users manage own preferences" on public.notification_preferences for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users read own blocks" on public.blocked_users for select to authenticated using (blocker_id = (select auth.uid()));
create policy "users create own blocks" on public.blocked_users for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "users delete own blocks" on public.blocked_users for delete to authenticated using (blocker_id = (select auth.uid()));
create policy "users read own creator application" on public.creator_applications for select to authenticated using (user_id = (select auth.uid()));
create policy "users create own creator application" on public.creator_applications for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users update draft creator application" on public.creator_applications for update to authenticated using (user_id = (select auth.uid()) and status in ('draft', 'rejected')) with check (user_id = (select auth.uid()));

create index profiles_username_idx on public.profiles (lower(username));
create index creator_applications_status_idx on public.creator_applications (status, submitted_at desc);
create index audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);
