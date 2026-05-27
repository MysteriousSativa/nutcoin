-- Chaos Engine + referral helpers (run after schema.sql)

create table if not exists public.current_event (
  id          int primary key default 1 check (id = 1),
  event_type  text,
  started_at  timestamptz,
  ends_at     timestamptz,
  intensity   int default 1,
  updated_at  timestamptz not null default now()
);

insert into public.current_event (id, event_type) values (1, null)
on conflict (id) do nothing;

create or replace function public.get_current_event()
returns table(event_type text, started_at timestamptz, ends_at timestamptz, intensity int)
language sql security definer set search_path = public stable
as $$
  select event_type, started_at, ends_at, intensity
  from public.current_event where id = 1 and event_type is not null and ends_at > now();
$$;

create or replace function public.set_current_event(
  p_event_type text,
  p_duration_minutes int default 30
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  update public.current_event set
    event_type = p_event_type,
    started_at = now(),
    ends_at = now() + (p_duration_minutes || ' minutes')::interval,
    updated_at = now()
  where id = 1;
  return jsonb_build_object('ok', true, 'event_type', p_event_type);
end;
$$;

grant execute on function public.get_current_event() to anon, authenticated;
grant execute on function public.set_current_event(text, int) to service_role;
