-- $NUT — Supabase schema (run in SQL Editor — safe to re-run)
-- Dashboard: https://supabase.com/dashboard → SQL → New query → Run

-- ── Table ─────────────────────────────────────────────────────────────
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

create index if not exists nut_logs_session_created_idx
  on public.nut_logs (session_id, created_at desc);

create index if not exists nut_logs_deed_date_idx
  on public.nut_logs (deed_date);

create index if not exists nut_logs_nut_type_idx
  on public.nut_logs (nut_type);

-- ── Remove old wide-open policies ───────────────────────────────────────
drop policy if exists "insert" on public.nut_logs;
drop policy if exists "select" on public.nut_logs;
drop policy if exists "public insert" on public.nut_logs;
drop policy if exists "public select" on public.nut_logs;

alter table public.nut_logs enable row level security;

-- ── Log a nut (10 min cooldown per session) ─────────────────────────────
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

  if length(v_type) > 32 then
    v_type := left(v_type, 32);
  end if;

  select max(created_at) into last_at
  from public.nut_logs
  where session_id = p_session_id;

  if last_at is not null and last_at > now() - cooldown then
    return jsonb_build_object(
      'ok', false,
      'error', 'cooldown',
      'retry_after_seconds', greatest(0, extract(epoch from (last_at + cooldown - now()))::int)
    );
  end if;

  insert into public.nut_logs (session_id, nickname, deed_date, nut_type, points)
  values (p_session_id, nullif(trim(p_nickname), ''), p_deed_date, v_type, v_pts);

  return jsonb_build_object('ok', true, 'nut_type', v_type, 'points', v_pts);
end;
$$;

-- ── Global counts ───────────────────────────────────────────────────────
create or replace function public.global_counts(p_deed_date date default current_date)
returns table(today_count bigint, all_time_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select coalesce(sum(points), 0)::bigint from public.nut_logs where deed_date = p_deed_date),
    (select coalesce(sum(points), 0)::bigint from public.nut_logs);
$$;

-- ── Leaderboard top 20 ──────────────────────────────────────────────────
create or replace function public.leaderboard()
returns table(session_id text, nickname text, deeds bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    session_id,
    max(nickname) as nickname,
    coalesce(sum(points), 0)::bigint as deeds
  from public.nut_logs
  group by session_id
  order by deeds desc
  limit 20;
$$;

-- ── Method mix today (optional analytics) ───────────────────────────────
create or replace function public.nut_type_stats(p_deed_date date default current_date)
returns table(nut_type text, cnt bigint)
language sql
security definer
set search_path = public
stable
as $$
  select nut_type, coalesce(sum(points), 0)::bigint as cnt
  from public.nut_logs
  where deed_date = p_deed_date
  group by nut_type
  order by cnt desc;
$$;

-- ── Grants ──────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert on public.nut_logs to service_role;
revoke all on public.nut_logs from anon, authenticated;

grant execute on function public.log_nut(text, text, date, text, int) to anon, authenticated;
grant execute on function public.global_counts(date) to anon, authenticated;
grant execute on function public.leaderboard() to anon, authenticated;
grant execute on function public.nut_type_stats(date) to anon, authenticated;

-- Drop old overloads if upgrading
drop function if exists public.log_nut(text, text, date);
drop function if exists public.log_nut(text, text, date, text);
