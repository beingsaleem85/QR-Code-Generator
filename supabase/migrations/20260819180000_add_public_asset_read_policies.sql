-- Module 3.8 (File-Based QR Types): the public /p/[slug] landing page needs
-- to generate signed URLs for an anonymous visitor's benefit, for files
-- that live in the private qr-documents/qr-gallery/qr-media buckets
-- (Module 1.5). Rather than reach for the service-role key, this is done
-- entirely through RLS: a narrow, additional SELECT policy grants
-- `anon`/`authenticated` read access to exactly the objects that are
-- legitimately part of a published (active, dynamic) QR's experience.
--
-- A plain subquery in the policy's USING clause would NOT work here: it
-- would run as the calling role (anon), and qr_assets/qr_codes both have
-- their own RLS with no anon SELECT policy, so the subquery would always
-- see zero rows and the policy would never grant anything. The standard,
-- documented fix is a SECURITY DEFINER helper function — it runs with the
-- function owner's privilege for the inner check regardless of the
-- caller's role, the same pattern Module 3.6 already established for
-- resolve_qr_redirect/record_qr_scan, just used inside a policy instead
-- of called directly.
create or replace function public.qr_asset_is_publicly_readable(p_bucket text, p_path text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.qr_assets a
    join public.qr_codes qc on qc.id = a.qr_code_id
    where a.bucket = p_bucket
      and a.path = p_path
      and qc.mode = 'dynamic'
      and qc.status = 'active'
  );
$$;

revoke all on function public.qr_asset_is_publicly_readable(text, text) from public;
grant execute on function public.qr_asset_is_publicly_readable(text, text) to anon, authenticated;

-- The existing owner-only select/insert/update/delete policies from
-- Module 1.5 are untouched — this adds a policy, it doesn't relax or
-- replace one, so an owner's full CRUD over their own files (including
-- files belonging to a paused, archived, or still-unsaved QR) is exactly
-- as private as before. The moment a QR is paused or archived, signed-URL
-- generation for its files starts failing immediately through this same
-- policy — no separate "is it still active" check needs to be kept in
-- sync by hand anywhere else.
create policy "qr_documents_public_read_active" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'qr-documents' and public.qr_asset_is_publicly_readable(bucket_id, name));

create policy "qr_gallery_public_read_active" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'qr-gallery' and public.qr_asset_is_publicly_readable(bucket_id, name));

create policy "qr_media_public_read_active" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'qr-media' and public.qr_asset_is_publicly_readable(bucket_id, name));

-- qr-logos is deliberately excluded: logos are only ever composited server
-- side into a rendered QR image (Module 3.3), never served as a standalone
-- public file, so there is no legitimate anonymous-read use case for it.
