-- Metadata for files uploaded to Supabase Storage (logos, PDFs, gallery
-- images, audio). The actual file lives in Storage; this row just tracks
-- ownership and location. Storage buckets/policies are defined in Module 1.5.
create table public.qr_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  qr_code_id uuid references public.qr_codes (id) on delete set null,
  asset_type text not null,
  bucket text not null,
  path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  constraint qr_assets_bucket_path_unique unique (bucket, path)
);

create index qr_assets_user_id_idx on public.qr_assets (user_id);
create index qr_assets_qr_code_id_idx on public.qr_assets (qr_code_id);

alter table public.qr_assets enable row level security;
