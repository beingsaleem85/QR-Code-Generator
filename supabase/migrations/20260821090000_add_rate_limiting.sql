-- Module 3.12 (Security Hardening): a small, durable rate limiter for the
-- two genuinely anonymous, publicly-hittable write/redirect surfaces in
-- this app — /r/[slug] (dynamic redirect abuse, which doubles as
-- scan-event-flood protection since a scan is recorded on the same
-- request) and submit_qr_feedback (anonymous feedback spam). Postgres-
-- backed rather than in-memory: this app has no chosen deployment
-- platform yet, and an in-memory counter is silently wrong the moment a
-- serverless/multi-instance environment routes two requests to different
-- instances — the shared database is the one piece of state every
-- deployment target already talks to on every request anyway.
--
-- Signup/login abuse is already covered by Supabase Auth's own built-in
-- rate limits (this project hit its real email-send limit organically
-- during earlier live verification — see docs/SESSION_HANDOFF.md), so
-- this migration doesn't duplicate that.
create table public.rate_limit_buckets (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0
);

-- No RLS policy of any kind (not even for the owning role) — this table
-- has no user_id and is never meant to be read or written directly by
-- any client. The only access path is check_rate_limit() below.
alter table public.rate_limit_buckets enable row level security;

-- Periodic manual cleanup is enough at this scale (a handful of rows per
-- distinct key, overwritten in place every window) — no cron job needed
-- for an MVP; revisit only if the table's row count becomes a real
-- concern (Module 3.13's own performance audit is the right place for
-- that, not here).
create or replace function public.check_rate_limit(
  p_key text,
  p_max_per_window integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limit_buckets (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
  set
    count = case
      when public.rate_limit_buckets.window_start <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limit_buckets.count + 1
    end,
    window_start = case
      when public.rate_limit_buckets.window_start <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else public.rate_limit_buckets.window_start
    end
  returning count into v_count;

  return v_count <= p_max_per_window;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;
