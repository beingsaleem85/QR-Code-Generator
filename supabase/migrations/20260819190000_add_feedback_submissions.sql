-- Module 3.9 (Hosted Landing Page QR Types): the "feedback" QR type needs
-- an anonymous visitor to be able to submit a rating/comment/contact field
-- with no authenticated session at all — the same "no client-facing write
-- policy, a narrow SECURITY DEFINER RPC keyed by slug instead" pattern
-- Module 3.6 established for record_qr_scan (see
-- 20260818120000_add_redirect_rpc_functions.sql's own comment for the full
-- reasoning). A generic anon INSERT policy would let a caller attach
-- arbitrary feedback to any qr_code_id directly; the RPC resolves the slug
-- itself instead and only ever inserts against a real, active, feedback-
-- type dynamic QR.
create table public.qr_feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  comment text,
  contact text,
  submitted_at timestamptz not null default now()
);

create index qr_feedback_submissions_qr_code_id_idx on public.qr_feedback_submissions (qr_code_id);
create index qr_feedback_submissions_submitted_at_idx on public.qr_feedback_submissions (submitted_at);

alter table public.qr_feedback_submissions enable row level security;

-- Owner-only read (via the qr_codes.user_id join, same shape as
-- qr_scan_events_select_own) — no insert/update/delete policy for any
-- role, so a submission can only ever be created via submit_qr_feedback
-- below, and once created is immutable (not even the owner can edit/delete
-- individual rows through the client, matching qr_scan_events' precedent
-- that analytics-like records shouldn't be editable after the fact).
create policy "qr_feedback_submissions_select_own" on public.qr_feedback_submissions
  for select to authenticated
  using (
    exists (
      select 1
      from public.qr_codes
      where qr_codes.id = qr_feedback_submissions.qr_code_id
        and qr_codes.user_id = auth.uid()
    )
  );

-- Keyed by slug, not qr_code_id, so a caller can never target an arbitrary
-- internal id directly. Silently no-ops for an unknown slug, an inactive
-- QR, or a QR that isn't actually a feedback type — never raises, so the
-- public landing page always shows the same generic thank-you regardless,
-- rather than leaking which slugs exist or are active via an error
-- difference (mirrors record_qr_scan's own no-op-on-miss behavior).
create or replace function public.submit_qr_feedback(
  p_slug text,
  p_rating smallint default null,
  p_comment text default null,
  p_contact text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.qr_codes
  where slug = p_slug
    and mode = 'dynamic'
    and qr_type = 'feedback'
    and status = 'active';

  if v_id is not null then
    insert into public.qr_feedback_submissions (qr_code_id, rating, comment, contact)
    values (v_id, p_rating, p_comment, p_contact);
  end if;
end;
$$;

revoke all on function public.submit_qr_feedback(text, smallint, text, text) from public;
grant execute on function public.submit_qr_feedback(text, smallint, text, text) to anon, authenticated;
