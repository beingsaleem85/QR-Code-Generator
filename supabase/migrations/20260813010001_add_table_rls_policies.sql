-- Owner-only RLS policies for the tables created in Module 1.4. RLS was
-- already enabled (default-deny) on every table; this migration adds the
-- actual policies.
--
-- qr_scan_events and qr_codes are deliberately incomplete here — see the
-- comments below and docs/ARCHITECTURE.md ("Auth, Storage, and RLS").

-- ---------------------------------------------------------------------
-- profiles: a user can only see/manage their own profile row.
-- ---------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- qr_folders: full CRUD, owner-only.
-- ---------------------------------------------------------------------
create policy "qr_folders_select_own" on public.qr_folders
  for select to authenticated
  using (auth.uid() = user_id);

create policy "qr_folders_insert_own" on public.qr_folders
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "qr_folders_update_own" on public.qr_folders
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "qr_folders_delete_own" on public.qr_folders
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- qr_codes: full CRUD, owner-only, for the AUTHENTICATED OWNER'S OWN
-- dashboard use. This intentionally grants no SELECT to `anon`.
--
-- The public /r/[slug] redirect and /p/[slug] landing-page routes must
-- NOT resolve a slug through a client-facing RLS policy: per the master
-- build prompt (S7), "Do not open unrestricted public SELECT access to
-- full qr_codes rows merely to support redirects." Module 3.6 resolves
-- slugs through a privileged server-side path instead (the Supabase
-- service-role key, which bypasses RLS entirely, or a narrow
-- SECURITY DEFINER RPC function that returns only the minimum fields a
-- redirect needs) — never a generic anon SELECT policy on this table.
-- ---------------------------------------------------------------------
create policy "qr_codes_select_own" on public.qr_codes
  for select to authenticated
  using (auth.uid() = user_id);

create policy "qr_codes_insert_own" on public.qr_codes
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "qr_codes_update_own" on public.qr_codes
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "qr_codes_delete_own" on public.qr_codes
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- qr_assets: full CRUD, owner-only.
-- ---------------------------------------------------------------------
create policy "qr_assets_select_own" on public.qr_assets
  for select to authenticated
  using (auth.uid() = user_id);

create policy "qr_assets_insert_own" on public.qr_assets
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "qr_assets_update_own" on public.qr_assets
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "qr_assets_delete_own" on public.qr_assets
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- qr_scan_events: the OWNER may read their own QR codes' scan history
-- (via the qr_codes.user_id join, since this table has no user_id
-- column of its own). There is deliberately NO insert/update/delete
-- policy for `anon` or `authenticated` here: a scanning visitor must
-- never be able to write analytics rows directly (that would let an
-- attacker insert arbitrary qr_code_id/event data), and the owner must
-- not be able to edit their own scan history (that would let them
-- falsify analytics). Module 3.7's redirect route writes scan events
-- through a privileged server-side path (service-role key or a
-- SECURITY DEFINER RPC function) that resolves the slug itself and
-- attaches the qr_code_id internally, per master build prompt S7.
-- ---------------------------------------------------------------------
create policy "qr_scan_events_select_own" on public.qr_scan_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.qr_codes
      where qr_codes.id = qr_scan_events.qr_code_id
        and qr_codes.user_id = auth.uid()
    )
  );
