-- Opaque, cryptographically random public identifier for a PDF QR's
-- direct-open viewer link (`/v/[token]`), separate from `slug`. `slug`
-- stays the internal identifier used for analytics (`record_qr_scan`) and
-- the existing `/p/[slug]` landing page; `public_token` is only ever set
-- for a PDF QR created with "Open PDF directly" already enabled, and is
-- what actually gets printed into the QR image for those — never the
-- slug, never a Storage path, never the QR's own database id.
alter table public.qr_codes add column public_token text;

create unique index qr_codes_public_token_unique_idx
  on public.qr_codes (public_token) where public_token is not null;

-- resolve_public_token: the /v/[token] counterpart to resolve_landing_page,
-- keyed by public_token instead of slug. Also returns `slug` — used only
-- server-side (never sent to the client) so the existing `record_qr_scan`
-- RPC can be reused unchanged for analytics, rather than adding a second,
-- token-keyed scan-recording function.
create or replace function public.resolve_public_token(p_token text)
returns table (qr_type text, status text, payload_data jsonb, slug text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select qr_type, status, payload_data, slug
  from public.qr_codes
  where public_token = p_token and mode = 'dynamic'
  limit 1;
$$;

revoke all on function public.resolve_public_token(text) from public;
grant execute on function public.resolve_public_token(text) to anon, authenticated;
