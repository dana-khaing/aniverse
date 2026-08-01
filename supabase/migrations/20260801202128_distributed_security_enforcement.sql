create table public.api_rate_limits (
  key_hash text primary key,
  tokens double precision not null check (tokens >= 0),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.api_rate_limits to service_role;

create index api_rate_limits_expiry_idx on public.api_rate_limits(expires_at);

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_capacity integer,
  p_refill_per_second double precision,
  p_now timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_bucket public.api_rate_limits%rowtype;
  available double precision;
begin
  if length(p_key_hash) <> 64 or p_capacity < 1 or p_capacity > 10000
    or p_refill_per_second <= 0 or p_refill_per_second > 1000 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.api_rate_limits(key_hash, tokens, updated_at, expires_at)
  values (
    p_key_hash,
    p_capacity::double precision,
    p_now,
    p_now + greatest(interval '10 minutes', make_interval(secs => ceil(p_capacity / p_refill_per_second)::integer * 2))
  )
  on conflict (key_hash) do nothing;

  select * into current_bucket
  from public.api_rate_limits
  where key_hash = p_key_hash
  for update;

  available := least(
    p_capacity::double precision,
    current_bucket.tokens + greatest(0, extract(epoch from (p_now - current_bucket.updated_at))) * p_refill_per_second
  );
  if available < 1 then
    update public.api_rate_limits
    set tokens = available, updated_at = p_now
    where key_hash = p_key_hash;
    return false;
  end if;

  update public.api_rate_limits
  set tokens = available - 1,
      updated_at = p_now,
      expires_at = p_now + greatest(interval '10 minutes', make_interval(secs => ceil(p_capacity / p_refill_per_second)::integer * 2))
  where key_hash = p_key_hash;
  return true;
end;
$$;

revoke execute on function public.consume_api_rate_limit(text, integer, double precision, timestamptz)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, double precision, timestamptz)
  to service_role;
