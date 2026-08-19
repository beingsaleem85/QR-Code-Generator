-- Module 3.13 (Performance and Reliability): "Dynamic redirects must
-- remain lightweight" is the master prompt's own explicit requirement for
-- this exact route. Module 3.12 added a real rate-limit check to
-- /r/[slug], but as originally wired it cost a *second* sequential
-- round-trip to Supabase on every single request, on top of the existing
-- resolve_qr_redirect call — doubling the number of network round trips
-- on the hottest, most latency-sensitive path in the app. This migration
-- combines both into one function, so one HTTP round trip does the work
-- of two.
--
-- Calls the existing check_rate_limit() rather than duplicating its
-- counter logic — both are SECURITY DEFINER, and a SECURITY DEFINER
-- function calling another SECURITY DEFINER function is standard,
-- supported Postgres composition; each still runs with its own definer's
-- privileges independently.
create or replace function public.resolve_qr_redirect_checked(
  p_slug text,
  p_rate_limit_key text default null,
  p_max_per_window integer default 60,
  p_window_seconds integer default 60
)
returns table (destination_url text, status text, rate_limited boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_allowed boolean := true;
begin
  if p_rate_limit_key is not null then
    v_allowed := public.check_rate_limit(p_rate_limit_key, p_max_per_window, p_window_seconds);
  end if;

  if not v_allowed then
    return query select null::text, null::text, true;
    return;
  end if;

  return query
    select qr_codes.destination_url, qr_codes.status, false
    from public.qr_codes
    where qr_codes.slug = p_slug and qr_codes.mode = 'dynamic'
    limit 1;
end;
$$;

revoke all on function public.resolve_qr_redirect_checked(text, text, integer, integer) from public;
grant execute on function public.resolve_qr_redirect_checked(text, text, integer, integer)
  to anon, authenticated;
