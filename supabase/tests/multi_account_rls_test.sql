begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'every public table has row-level security enabled'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'rls-a@aniverse.test', '',
    now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'rls-b@aniverse.test', '',
    now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );

update public.profiles
set profile_public = false, profile_visibility = 'private'
where id = '20000000-0000-4000-8000-000000000002';

insert into public.custom_lists (id, user_id, name) values
  (
    'a1000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'User A list'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'User B list'
  );

insert into public.creator_teams (id, name, slug, created_by) values
  (
    'c1000000-0000-4000-8000-000000000001',
    'User A Studio',
    'rls-user-a-studio',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    'c2000000-0000-4000-8000-000000000002',
    'User B Studio',
    'rls-user-b-studio',
    '20000000-0000-4000-8000-000000000002'
  );

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  'select count(*) from public.custom_lists',
  array[1::bigint],
  'user A sees only their own list'
);
select results_eq(
  $$select name from public.custom_lists$$,
  array['User A list'::text],
  'user A cannot read user B list data'
);
select is_empty(
  $$
    update public.custom_lists
    set name = 'Compromised'
    where id = 'b2000000-0000-4000-8000-000000000002'
    returning id
  $$,
  'user A cannot update user B list'
);
select results_eq(
  $$select count(*) from public.profiles
    where id = '20000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'user A cannot read user B private profile'
);
select results_eq(
  'select count(*) from public.user_roles',
  array[1::bigint],
  'user A sees only their own role'
);
select results_eq(
  'select count(*) from public.creator_teams',
  array[1::bigint],
  'user A sees only their own creator team'
);
select throws_ok(
  $$insert into public.user_roles (user_id, role)
    values ('10000000-0000-4000-8000-000000000001', 'admin')$$,
  '42501',
  null,
  'authenticated users cannot grant themselves admin'
);

set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000002';

select results_eq(
  $$select name from public.custom_lists$$,
  array['User B list'::text],
  'user B sees only their own list'
);
select results_eq(
  $$select count(*) from public.profiles
    where id = '20000000-0000-4000-8000-000000000002'$$,
  array[1::bigint],
  'user B can read their own private profile'
);
select is_empty(
  $$
    delete from public.custom_lists
    where id = 'a1000000-0000-4000-8000-000000000001'
    returning id
  $$,
  'user B cannot delete user A list'
);
select results_eq(
  'select count(*) from public.creator_teams',
  array[1::bigint],
  'user B sees only their own creator team'
);

set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'anon';

select results_eq(
  $$select count(*) from public.profiles
    where id = '20000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'anonymous users cannot read private profiles'
);
select results_eq(
  $$select count(*) from public.titles where status <> 'published'$$,
  array[0::bigint],
  'anonymous users cannot read unpublished titles'
);

select * from finish();
rollback;
