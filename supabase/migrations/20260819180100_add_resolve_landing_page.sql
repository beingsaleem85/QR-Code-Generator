-- Module 3.8: /p/[slug] (the hosted landing page for file-based QR types —
-- PDF, image gallery, audio, video) needs to resolve a slug the same way
-- Module 3.6's /r/[slug] does, and for the same reason: qr_codes has no
-- anon-facing SELECT policy (Module 1.5's deliberate design). Mirrors
-- resolve_qr_redirect exactly, just returning the fields a landing page
-- needs instead of a redirect target. `payload_data` already carries every
-- Storage path the landing page needs to generate signed URLs for (a
-- single path for pdf/audio, an ordered array for image galleries) — see
-- src/lib/qr/payload-builders for the exact per-type shape — so this
-- function alone is enough; the landing page doesn't need a second,
-- separate privileged read of qr_assets.
create or replace function public.resolve_landing_page(p_slug text)
returns table (qr_type text, status text, payload_data jsonb)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select qr_type, status, payload_data
  from public.qr_codes
  where slug = p_slug and mode = 'dynamic'
  limit 1;
$$;

revoke all on function public.resolve_landing_page(text) from public;
grant execute on function public.resolve_landing_page(text) to anon, authenticated;
