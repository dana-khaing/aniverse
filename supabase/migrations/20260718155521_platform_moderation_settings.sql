create table public.platform_settings(id boolean primary key default true check(id),mature_content_enabled boolean not null default false,updated_by uuid references auth.users(id) on delete set null,updated_at timestamptz not null default now());
alter table public.platform_settings enable row level security;
grant select on public.platform_settings to authenticated;
create policy "staff read platform settings" on public.platform_settings for select to authenticated using(exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in('moderator','admin')));
insert into public.platform_settings(id) values(true);
