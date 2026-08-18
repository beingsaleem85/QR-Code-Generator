-- Module 3.6 (Dynamic QR Codes): the public `/r/[slug]` route must resolve a
-- slug and record a scan without a client-facing RLS SELECT/INSERT policy on
-- qr_codes / qr_scan_events (see the qr_scan_events policy comment in
-- 20260813010001_add_table_rls_policies.sql). These two narrow SECURITY
-- DEFINER functions are the "privileged server-side path" that comment
-- anticipated — chosen over the service-role key so no new privileged
-- secret needs to exist at all: each function runs with the owning role's
-- privilege but only ever exposes/accepts the minimum fields a redirect
-- needs, never user_id/name/payload_data/design_config.

-- Resolves a dynamic QR's current destination + status. Returns no row for
-- a missing slug or a static QR's slug (static codes never route through
-- here). Deliberately does not return the row id — the caller never needs
-- an internal database id to serve a redirect.
create or replace function public.resolve_qr_redirect(p_slug text)
returns table (destination_url text, status text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select destination_url, status
  from public.qr_codes
  where slug = p_slug and mode = 'dynamic'
  limit 1;
$$;

revoke all on function public.resolve_qr_redirect(text) from public;
grant execute on function public.resolve_qr_redirect(text) to anon, authenticated;

-- Records one scan against a dynamic QR and bumps its cached count,
-- atomically, keyed by slug rather than by row id so a caller can never
-- target an arbitrary internal id directly — only slugs that actually
-- resolve to a dynamic QR have any effect. Silently no-ops for an unknown
-- slug (mirrors resolve_qr_redirect's "no row" behavior) rather than
-- raising, since a scan-recording failure must never be able to break the
-- redirect itself. Metadata params are optional and unused by Module 3.6's
-- own recording (referrer only) — Module 3.7 (Scan Analytics) is where real
-- device/OS/browser parsing gets wired through them.
create or replace function public.record_qr_scan(
  p_slug text,
  p_device_type text default null,
  p_os text default null,
  p_browser text default null,
  p_referrer text default null
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
    insert into public.qr_scan_events (qr_code_id, device_type, os, browser, referrer)
    values (v_id, p_device_type, p_os, p_browser, p_referrer);
  end if;
end;
$$;

revoke all on function public.record_qr_scan(text, text, text, text, text) from public;
grant execute on function public.record_qr_scan(text, text, text, text, text) to anon, authenticated;
