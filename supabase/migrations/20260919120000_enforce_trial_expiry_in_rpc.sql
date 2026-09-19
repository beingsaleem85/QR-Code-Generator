-- QRForge v8: Enforce 14-day Free trial expiry across all dynamic QR resolution RPCs.
-- Evaluated dynamically at request time without mass-mutating database rows.
-- Effective availability rule: qrIsUsable = qr.status = 'active' AND accountHasValidAccess.
-- Paid Pro and Lifetime accounts bypass trial restrictions.
-- Upgrading to Pro immediately reactivates dynamic QRs without changing slugs, QR IDs, or printed assets.
-- Manually paused QRs remain paused.

-- 1. resolve_qr_redirect_checked (used by /r/[slug] and root vanity /[slug])
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
    select
      qr_codes.destination_url,
      case
        when qr_codes.status <> 'active' then qr_codes.status
        when coalesce(ae.is_lifetime, false) = true then 'active'
        when coalesce(ae.plan, 'free') = 'pro' and (ae.expires_at is null or ae.expires_at > now()) then 'active'
        when now() < (u.created_at + interval '14 days') then 'active'
        else 'inactive'
      end as status,
      false as rate_limited
    from public.qr_codes
    join auth.users u on u.id = qr_codes.user_id
    left join public.account_entitlements ae on ae.user_id = qr_codes.user_id
    where qr_codes.slug = p_slug and qr_codes.mode = 'dynamic'
    limit 1;
end;
$$;

revoke all on function public.resolve_qr_redirect_checked(text, text, integer, integer) from public;
grant execute on function public.resolve_qr_redirect_checked(text, text, integer, integer)
  to anon, authenticated;


-- 2. resolve_landing_page (used by /p/[slug], public PDF, gallery, audio, video, menu, etc.)
create or replace function public.resolve_landing_page(p_slug text)
returns table (qr_type text, status text, payload_data jsonb)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    qr_codes.qr_type,
    case
      when qr_codes.status <> 'active' then qr_codes.status
      when coalesce(ae.is_lifetime, false) = true then 'active'
      when coalesce(ae.plan, 'free') = 'pro' and (ae.expires_at is null or ae.expires_at > now()) then 'active'
      when now() < (u.created_at + interval '14 days') then 'active'
      else 'inactive'
    end as status,
    qr_codes.payload_data
  from public.qr_codes
  join auth.users u on u.id = qr_codes.user_id
  left join public.account_entitlements ae on ae.user_id = qr_codes.user_id
  where qr_codes.slug = p_slug and qr_codes.mode = 'dynamic'
  limit 1;
$$;

revoke all on function public.resolve_landing_page(text) from public;
grant execute on function public.resolve_landing_page(text) to anon, authenticated;


-- 3. resolve_public_token (used by /v/[token] and /api/pdf-view/[token])
create or replace function public.resolve_public_token(p_token text)
returns table (qr_type text, status text, payload_data jsonb, slug text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    qr_codes.qr_type,
    case
      when qr_codes.status <> 'active' then qr_codes.status
      when coalesce(ae.is_lifetime, false) = true then 'active'
      when coalesce(ae.plan, 'free') = 'pro' and (ae.expires_at is null or ae.expires_at > now()) then 'active'
      when now() < (u.created_at + interval '14 days') then 'active'
      else 'inactive'
    end as status,
    qr_codes.payload_data,
    qr_codes.slug
  from public.qr_codes
  join auth.users u on u.id = qr_codes.user_id
  left join public.account_entitlements ae on ae.user_id = qr_codes.user_id
  where qr_codes.public_token = p_token and qr_codes.mode = 'dynamic'
  limit 1;
$$;

revoke all on function public.resolve_public_token(text) from public;
grant execute on function public.resolve_public_token(text) to anon, authenticated;
