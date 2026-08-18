-- Extends account_entitlements with a per-plan Dynamic QR quota. NULL is
-- the explicit domain value for "unlimited" — not a magic sentinel like -1
-- or 999999999 — so "no limit" is representable without a special case at
-- every call site. A missing entitlement row still means "free" overall
-- (src/lib/account/entitlements.ts), and free's implicit dynamic_qr_limit
-- is also NULL for now: no commercial free-tier cap has been decided
-- anywhere in this project yet, so the resolver mechanism is real and
-- fully enforced, but there is currently nothing configured to enforce —
-- introducing an actual numeric free-tier limit is a product decision for
-- a future module, not something to invent here.
alter table public.account_entitlements
  add column dynamic_qr_limit integer
    check (dynamic_qr_limit is null or dynamic_qr_limit >= 0);

comment on column public.account_entitlements.dynamic_qr_limit is
  'Max dynamic QR codes (active + paused, archived excluded) this account may have at once. NULL = unlimited.';
