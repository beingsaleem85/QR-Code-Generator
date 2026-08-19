-- Hardens Dynamic QR quota enforcement at the database boundary. Until
-- now, `account_entitlements.dynamic_qr_limit` was only checked in
-- application code (checkDynamicQrAllowance in src/lib/qr/actions.ts),
-- which a client calling the Supabase REST API directly with their own
-- valid JWT could bypass entirely — RLS still prevents touching another
-- user's rows, so this was only ever a self-quota bypass, never a
-- cross-user one, but it's still a real gap.
--
-- One semantic source, matching src/lib/qr/queries.ts's
-- countDynamicQrCodes() exactly: counts qr_codes rows for the same user
-- with mode = 'dynamic' and status <> 'archived' (active + paused count
-- against the limit, archived doesn't). A NULL dynamic_qr_limit, or a
-- missing account_entitlements row entirely, still means unlimited — the
-- same "no configured cap today" reality the column's own comment
-- (20260819150000_add_dynamic_qr_limit.sql) documents; this migration
-- adds enforcement, it does not introduce a cap that doesn't already
-- exist as a resolved value somewhere.
--
-- Fires on every INSERT (new dynamic QR, duplicate of a dynamic QR) and
-- on UPDATE that turns an existing QR dynamic (static -> dynamic
-- conversion) — the three application code paths (saveQrCode,
-- updateQrCode, duplicateQrCode) all funnel through a plain insert/update
-- on this one table, so a single trigger covers every write path without
-- keeping three separate application-level checks in sync, and without
-- creating a second, competing definition of the quota.
--
-- Concurrency: locks the account's own entitlement row with `for update`
-- before counting, so two concurrent dynamic-QR-creation requests from
-- the same user serialize against each other — the second waits for the
-- first's transaction to commit, then re-reads the count including the
-- first's newly-committed row, instead of both reading the same
-- pre-insert count and both passing. Different users never contend with
-- each other's inserts, since each only locks their own entitlement row.
-- A user with no entitlement row at all skips the lock entirely (nothing
-- to serialize against), since a missing row already means unlimited.
create or replace function public.enforce_dynamic_qr_quota()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if new.mode <> 'dynamic' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.mode = 'dynamic' then
    -- Already dynamic — this write isn't allocating a new slot, it's
    -- editing content on a QR that already consumed one.
    return new;
  end if;

  select dynamic_qr_limit into v_limit
  from public.account_entitlements
  where user_id = new.user_id
  for update;

  if not found or v_limit is null then
    return new;
  end if;

  select count(*) into v_count
  from public.qr_codes
  where user_id = new.user_id
    and mode = 'dynamic'
    and status <> 'archived'
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_count >= v_limit then
    raise exception
      'DYNAMIC_QR_QUOTA_EXCEEDED: account % has reached its dynamic QR limit of %', new.user_id, v_limit
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_dynamic_qr_quota on public.qr_codes;
create trigger trg_enforce_dynamic_qr_quota
  before insert or update on public.qr_codes
  for each row
  execute function public.enforce_dynamic_qr_quota();
