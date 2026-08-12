-- Storage buckets. Path convention inside every bucket:
--   {user_id}/{qr_code_id_or_asset_id}/{sanitized_filename}
-- The leading {user_id} segment is what the storage.objects policies
-- below check against auth.uid() — enforced at the database level, not
-- just by client code choosing "nice" paths.
--
-- All buckets are PRIVATE except `avatars`. Avatars are the one asset
-- type meant to be displayed freely across the UI (profile menus, any
-- future public profile/business pages), have no sensitive content, and
-- avoid needing a signed URL refreshed on every render. Every other
-- bucket holds QR-specific content that should only be reachable through
-- an owner action or a server-mediated flow (a signed URL, or the
-- landing-page/redirect route) — never a bare public URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('qr-logos', 'qr-logos', false, 2097152, array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('qr-documents', 'qr-documents', false, 20971520, array['application/pdf']),
  ('qr-gallery', 'qr-gallery', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('qr-media', 'qr-media', false, 15728640, array['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'])
on conflict (id) do nothing;

-- Video QR codes intentionally have no storage bucket: the master build
-- prompt prefers linking an external host (YouTube/Vimeo/etc.) over
-- self-hosting video, to avoid unbounded storage/bandwidth cost.

-- ---------------------------------------------------------------------
-- avatars: public read (anyone), owner-only write.
-- ---------------------------------------------------------------------
create policy "avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- qr-logos: private, full CRUD within the caller's own {user_id}/ folder.
-- ---------------------------------------------------------------------
create policy "qr_logos_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'qr-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_logos_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'qr-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_logos_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'qr-logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'qr-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_logos_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'qr-logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- qr-documents: private, full CRUD within the caller's own {user_id}/ folder.
-- ---------------------------------------------------------------------
create policy "qr_documents_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'qr-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_documents_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'qr-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_documents_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'qr-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'qr-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_documents_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'qr-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- qr-gallery: private, full CRUD within the caller's own {user_id}/ folder.
-- ---------------------------------------------------------------------
create policy "qr_gallery_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'qr-gallery' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_gallery_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'qr-gallery' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_gallery_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'qr-gallery' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'qr-gallery' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_gallery_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'qr-gallery' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- qr-media (audio): private, full CRUD within the caller's own {user_id}/ folder.
-- ---------------------------------------------------------------------
create policy "qr_media_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'qr-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_media_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'qr-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_media_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'qr-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'qr-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "qr_media_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'qr-media' and (storage.foldername(name))[1] = auth.uid()::text);
