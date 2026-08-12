-- Core QR record: static and dynamic codes share this table. `qr_type`
-- values must stay in sync with the QRType union in src/types/qr.ts.
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid references public.qr_folders (id) on delete set null,
  name text not null,
  slug text,
  mode text not null check (mode in ('static', 'dynamic')),
  qr_type text not null check (
    qr_type in (
      'url', 'text', 'email', 'phone', 'sms', 'vcard', 'whatsapp', 'wifi',
      'pdf', 'app', 'images', 'video', 'social', 'event', 'barcode_2d',
      'multi_link', 'menu', 'feedback', 'audio', 'location'
    )
  ),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  -- Encoded content config (never secrets) — see src/lib/qr for the shape per qr_type.
  payload_data jsonb not null default '{}'::jsonb,
  -- Current redirect target for dynamic codes only.
  destination_url text,
  -- Versionable design/style config (frame, colors, logo, etc.).
  design_config jsonb not null default '{}'::jsonb,
  -- Config for hosted-landing-page types (Module 3.9); null otherwise.
  landing_page_config jsonb,
  scan_count_cached bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qr_codes_dynamic_requires_slug check (mode <> 'dynamic' or slug is not null)
);

-- Slugs are the public /r/[slug] and /p/[slug] identifiers, so they must be
-- globally unique when present; static codes may leave it null.
create unique index qr_codes_slug_unique_idx on public.qr_codes (slug) where slug is not null;
create index qr_codes_user_id_idx on public.qr_codes (user_id);
create index qr_codes_created_at_idx on public.qr_codes (created_at);
create index qr_codes_folder_id_idx on public.qr_codes (folder_id);

create trigger set_qr_codes_updated_at
  before update on public.qr_codes
  for each row
  execute function public.set_updated_at();

alter table public.qr_codes enable row level security;
