-- Module 3.10 (Dashboard Search, Filters, and Organization): real
-- database-side search/filter/sort/pagination for the QR list, plus a
-- lightweight aggregate-stats RPC for the dashboard overview cards — both
-- exist specifically to avoid the anti-pattern the master build prompt
-- calls out by name: "Avoid loading thousands of QR rows client-side and
-- filtering them in memory."

-- pg_trgm backs a GIN index that makes `ilike '%term%'` (substring, not
-- just prefix, search) an efficient index scan instead of a full table
-- scan — the standard Postgres approach for "search by name" at any real
-- scale.
create extension if not exists pg_trgm;

create index qr_codes_name_trgm_idx on public.qr_codes using gin (name gin_trgm_ops);

-- The default (and most common) list view is "this user's own non-archived
-- codes, newest-updated first" — a single composite index covering that
-- exact shape is worth more than speculative indexes for every possible
-- sort option; the master prompt gives database-index tuning its own
-- dedicated audit in Module 3.13, so this stays intentionally minimal
-- rather than pre-building an index per sort column now.
create index qr_codes_user_status_updated_idx
  on public.qr_codes (user_id, status, updated_at desc);

-- Aggregate counts for the dashboard overview cards (total/dynamic/scans),
-- computed in one query instead of fetching every row to sum/filter/count
-- client-side. No SECURITY DEFINER — this runs as the calling role
-- (Postgres's default), so `qr_codes_select_own`'s RLS policy already
-- scopes it to the caller's own rows with no extra logic needed here; any
-- authenticated user can safely call this and only ever sees their own
-- numbers.
create or replace function public.get_my_qr_code_stats()
returns table (total_count bigint, dynamic_count bigint, total_scans numeric)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    count(*) filter (where status <> 'archived') as total_count,
    count(*) filter (where mode = 'dynamic' and status <> 'archived') as dynamic_count,
    coalesce(sum(scan_count_cached) filter (where status <> 'archived'), 0) as total_scans
  from public.qr_codes;
$$;

grant execute on function public.get_my_qr_code_stats() to authenticated;
