-- Module 3.7 (Scan Analytics): adds a country_code parameter to Module
-- 3.6's record_qr_scan function. A function's identity in Postgres is its
-- (name, parameter types) signature, not its defaults — appending a new
-- parameter changes the signature, so `create or replace` would silently
-- create a second, overloaded function rather than replace the original,
-- leaving the old 5-argument version as dead but still-callable schema
-- clutter. Drop it explicitly first, then create the real replacement.
drop function if exists public.record_qr_scan(text, text, text, text, text);

create or replace function public.record_qr_scan(
  p_slug text,
  p_device_type text default null,
  p_os text default null,
  p_browser text default null,
  p_referrer text default null,
  p_country_code text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  update public.qr_codes
  set scan_count_cached = scan_count_cached + 1
  where slug = p_slug and mode = 'dynamic'
  returning id into v_id;

  if v_id is not null then
    insert into public.qr_scan_events (qr_code_id, device_type, os, browser, referrer, country_code)
    values (v_id, p_device_type, p_os, p_browser, p_referrer, p_country_code);
  end if;
end;
$$;

revoke all on function public.record_qr_scan(text, text, text, text, text, text) from public;
grant execute on function public.record_qr_scan(text, text, text, text, text, text) to anon, authenticated;
