-- $NUT Casino live feed (run in Supabase SQL Editor after schema.sql)

create table if not exists public.casino_events (
  id         bigserial primary key,
  session_id text not null,
  nickname   text,
  game       text not null check (game in ('spin', 'flip', 'crash', 'blackjack', 'poker')),
  bet        int not null default 0 check (bet >= 0),
  profit     int not null default 0,
  mult       numeric(10, 2),
  created_at timestamptz not null default now()
);

create index if not exists casino_events_created_idx on public.casino_events (created_at desc);
create index if not exists casino_events_session_idx on public.casino_events (session_id, created_at desc);

alter table public.casino_events enable row level security;
revoke all on public.casino_events from anon, authenticated;
grant select, insert on public.casino_events to service_role;

-- Record a casino win/loss (client calls after local play)
create or replace function public.record_casino_event(
  p_session_id text,
  p_nickname   text default null,
  p_game       text default 'spin',
  p_bet        int default 0,
  p_profit     int default 0,
  p_mult       numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game text := lower(trim(coalesce(p_game, 'spin')));
begin
  if p_session_id is null or length(trim(p_session_id)) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if v_game not in ('spin', 'flip', 'crash', 'blackjack', 'poker') then
    v_game := 'spin';
  end if;
  insert into public.casino_events (session_id, nickname, game, bet, profit, mult)
  values (
    trim(p_session_id),
    nullif(trim(p_nickname), ''),
    v_game,
    greatest(0, coalesce(p_bet, 0)),
    coalesce(p_profit, 0),
    p_mult
  );
  return jsonb_build_object('ok', true);
end;
$$;

-- Merged live feed: recent nuts + casino wins (for ticker)
create or replace function public.live_community_feed(p_limit int default 30)
returns table(
  kind       text,
  nickname   text,
  session_id text,
  message    text,
  profit     int,
  mult       numeric,
  game       text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with lim as (select greatest(1, least(coalesce(p_limit, 30), 50)) as n)
  select kind, nickname, session_id, message, profit, mult, game, created_at from (
    (
      select
        'nut'::text as kind,
        l.nickname,
        l.session_id,
        ('🥜 ' || coalesce(nullif(trim(l.nickname), ''), 'NutTracker') || ' logged +' || l.points::text || ' pts') as message,
        l.points as profit,
        null::numeric as mult,
        l.nut_type as game,
        l.created_at
      from public.nut_logs l
      order by l.created_at desc
      limit (select n from lim)
    )
    union all
    (
      select
        'casino'::text as kind,
        c.nickname,
        c.session_id,
        case c.game
          when 'spin' then '🎰 ' || coalesce(nullif(trim(c.nickname), ''), 'Player') || ' wheel +' || c.profit::text || ' NUTS'
          when 'flip' then '🪙 ' || coalesce(nullif(trim(c.nickname), ''), 'Player') || ' flip +' || greatest(c.profit, 0)::text || ' NUTS'
          when 'crash' then '🚀 ' || coalesce(nullif(trim(c.nickname), ''), 'Player') || ' crash ' ||
            coalesce(c.mult::text, '?') || '× +' || greatest(c.profit, 0)::text || ' NUTS'
          when 'blackjack' then '🃏 ' || coalesce(nullif(trim(c.nickname), ''), 'Player') || ' 21 +' || greatest(c.profit, 0)::text || ' NUTS'
          else '🎰 ' || coalesce(nullif(trim(c.nickname), ''), 'Player') || ' +' || c.profit::text || ' NUTS'
        end as message,
        c.profit,
        c.mult,
        c.game,
        c.created_at
      from public.casino_events c
      where c.profit > 0
      order by c.created_at desc
      limit (select n from lim)
    )
  ) combined
  order by created_at desc
  limit (select n from lim);
$$;

-- Top casino performers (watch list)
create or replace function public.casino_watchlist(p_limit int default 8)
returns table(
  session_id   text,
  nickname     text,
  total_profit bigint,
  win_count    bigint,
  best_win     int,
  best_mult    numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    session_id,
    max(nickname) as nickname,
    coalesce(sum(greatest(profit, 0)), 0)::bigint as total_profit,
    count(*) filter (where profit > 0)::bigint as win_count,
    coalesce(max(profit), 0)::int as best_win,
    max(mult) as best_mult
  from public.casino_events
  where created_at > now() - interval '14 days'
  group by session_id
  having coalesce(sum(greatest(profit, 0)), 0) > 0
  order by total_profit desc, best_win desc
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

grant execute on function public.record_casino_event(text, text, text, int, int, numeric) to anon, authenticated;
grant execute on function public.live_community_feed(int) to anon, authenticated;
grant execute on function public.casino_watchlist(int) to anon, authenticated;
