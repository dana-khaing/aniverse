create table public.watch_party_playback_events (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.watch_parties(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  sequence bigint not null,
  action text not null check (action in ('play', 'pause', 'seek')),
  position_seconds double precision not null check (position_seconds >= 0),
  playback_rate double precision not null check (playback_rate between 0.25 and 4),
  created_at timestamptz not null default now(),
  unique (party_id, operation_id),
  unique (party_id, sequence)
);
alter table public.watch_party_playback_events enable row level security;
grant select on public.watch_party_playback_events to authenticated;
create policy "party members read playback events"
on public.watch_party_playback_events for select to authenticated
using (exists (
  select 1 from public.watch_party_members
  where party_id = watch_party_playback_events.party_id
    and user_id = (select auth.uid())
));

create or replace function public.apply_party_playback_event(
  p_party_id uuid, p_operation_id uuid, p_expected_sequence bigint,
  p_action text, p_position_seconds double precision, p_playback_rate double precision
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_party public.watch_parties%rowtype; actor uuid := auth.uid(); next_sequence bigint;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_action not in ('play','pause','seek') or p_position_seconds < 0
    or p_playback_rate < 0.25 or p_playback_rate > 4 then raise exception 'Invalid playback event'; end if;
  if not exists (select 1 from public.watch_party_members
    where party_id=p_party_id and user_id=actor and role in ('host','moderator')) then
    raise exception 'Party control permission required';
  end if;
  select * into current_party from public.watch_parties where id=p_party_id for update;
  if current_party.id is null then raise exception 'Party not found'; end if;
  if current_party.status <> 'live' then raise exception 'Party is not live'; end if;
  if current_party.sequence <> p_expected_sequence then raise exception 'Stale party sequence'; end if;
  next_sequence := current_party.sequence + 1;
  insert into public.watch_party_playback_events
    (party_id,actor_id,operation_id,sequence,action,position_seconds,playback_rate)
  values (p_party_id,actor,p_operation_id,next_sequence,p_action,p_position_seconds,p_playback_rate)
  on conflict (party_id,operation_id) do nothing;
  if not found then
    return (select jsonb_build_object('sequence',sequence,'action',action,'position',position_seconds,
      'playbackRate',playback_rate,'sentAt',extract(epoch from created_at)*1000)
      from public.watch_party_playback_events where party_id=p_party_id and operation_id=p_operation_id);
  end if;
  update public.watch_parties set sequence=next_sequence,
    playback_state=case when p_action='play' then 'playing' else 'paused' end,
    playback_position=p_position_seconds, updated_at=now() where id=p_party_id;
  return jsonb_build_object('sequence',next_sequence,'action',p_action,'position',p_position_seconds,
    'playbackRate',p_playback_rate,'sentAt',extract(epoch from now())*1000);
end $$;
revoke execute on function public.apply_party_playback_event(uuid,uuid,bigint,text,double precision,double precision) from public,anon;
grant execute on function public.apply_party_playback_event(uuid,uuid,bigint,text,double precision,double precision) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='watch_parties') then
    alter publication supabase_realtime add table public.watch_parties;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='watch_party_playback_events') then
    alter publication supabase_realtime add table public.watch_party_playback_events;
  end if;
end $$;
