-- $NUT schema upgrade (run in Supabase SQL Editor if logs/activity are broken)
-- Safe to re-run. Full file: supabase/schema.sql

create table if not exists public.nut_logs (
  id         bigserial primary key,
  session_id text not null,
  nickname   text,
  nut_type   text not null default 'solo',
  points     int not null default 1 check (points >= 1 and points <= 10),
  deed_date  date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.nut_logs add column if not exists nut_type text not null default 'solo';
alter table public.nut_logs add column if not exists points int not null default 1;

create or replace function public.log_nut(
  p_session_id text,
  p_nickname   text default null,
  p_deed_date  date default current_date,
  p_nut_type   text default 'solo',
  p_points     int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  last_at timestamptz;
  cooldown interval := interval '10 minutes';
  v_type text := coalesce(nullif(trim(p_nut_type), ''), 'solo');
  v_pts int := greatest(1, least(coalesce(p_points, 1), 10));
begin
  if p_session_id is null or length(trim(p_session_id)) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if length(v_type) > 32 then v_type := left(v_type, 32); end if;
  select max(created_at) into last_at from public.nut_logs where session_id = p_session_id;
  if last_at is not null and last_at > now() - cooldown then
    return jsonb_build_object('ok', false, 'error', 'cooldown',
      'retry_after_seconds', greatest(0, extract(epoch from (last_at + cooldown - now()))::int));
  end if;
  insert into public.nut_logs (session_id, nickname, deed_date, nut_type, points)
  values (p_session_id, nullif(trim(p_nickname), ''), p_deed_date, v_type, v_pts);
  return jsonb_build_object('ok', true, 'nut_type', v_type, 'points', v_pts);
end;
$$;

create or replace function public.recent_activity(p_limit int default 25)
returns table(nickname text, session_id text, nut_type text, points int, created_at timestamptz)
language sql security definer set search_path = public stable
as $$
  select nickname, session_id, nut_type, points, created_at
  from public.nut_logs order by created_at desc
  limit greatest(1, least(coalesce(p_limit, 25), 50));
$$;

grant execute on function public.log_nut(text, text, date, text, int) to anon, authenticated;
grant execute on function public.recent_activity(int) to anon, authenticated;

drop function if exists public.log_nut(text, text, date);
drop function if exists public.log_nut(text, text, date, text);
