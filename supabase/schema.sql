-- $NUT — Supabase schema (run once in SQL Editor)
-- Project: https://supabase.com/dashboard → your project → SQL → New query → Run

-- ── Table ─────────────────────────────────────────────────────────────
create table if not exists public.nut_logs (
  id         bigserial primary key,
  session_id text not null,
  nickname   text,
  deed_date  date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists nut_logs_session_created_idx
  on public.nut_logs (session_id, created_at desc);

create index if not exists nut_logs_deed_date_idx
  on public.nut_logs (deed_date);

-- ── Remove old wide-open policies (if present) ───────────────────────────
drop policy if exists "insert" on public.nut_logs;
drop policy if exists "select" on public.nut_logs;
drop policy if exists "public insert" on public.nut_logs;
drop policy if exists "public select" on public.nut_logs;

alter table public.nut_logs enable row level security;
-- No anon policies on the table — clients use RPCs only (security definer).

-- ── Log a nut (10 min cooldown per session, server-side) ────────────────
create or replace function public.log_nut(
  p_session_id text,
  p_nickname   text default null,
  p_deed_date  date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  last_at timestamptz;
  cooldown interval := interval '10 minutes';
begin
  if p_session_id is null or length(trim(p_session_id)) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_session');
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

  insert into public.nut_logs (session_id, nickname, deed_date)
  values (p_session_id, nullif(trim(p_nickname), ''), p_deed_date);

  return jsonb_build_object('ok', true);
end;
$$;

-- ── Global counts (no full-table client fetch) ───────────────────────────
create or replace function public.global_counts(p_deed_date date default current_date)
returns table(today_count bigint, all_time_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*)::bigint from public.nut_logs where deed_date = p_deed_date),
    (select count(*)::bigint from public.nut_logs);
$$;

-- ── Leaderboard top 20 ───────────────────────────────────────────────────
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
    count(*)::bigint as deeds
  from public.nut_logs
  group by session_id
  order by deeds desc
  limit 20;
$$;

-- ── Grants (anon key from the website) ───────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert on public.nut_logs to service_role;
revoke all on public.nut_logs from anon, authenticated;

grant execute on function public.log_nut(text, text, date) to anon, authenticated;
grant execute on function public.global_counts(date) to anon, authenticated;
grant execute on function public.leaderboard() to anon, authenticated;
