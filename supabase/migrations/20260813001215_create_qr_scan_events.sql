-- One row per dynamic-QR scan, written by the /r/[slug] redirect route
-- (Module 3.6/3.7). Privacy-by-design: no raw IP address or raw user-agent
-- string is ever stored here — only derived, privacy-minimized fields.
-- The application layer is responsible for deriving country_code/region/
-- city, device_type/os/browser, and ip_hash before insert; this table has
-- no column for a raw IP or a raw User-Agent header on purpose.
create table public.qr_scan_events (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  country_code text,
  region text,
  city text,
  device_type text,
  os text,
  browser text,
  referrer text,
  -- Salted/hashed network identifier, only populated if a documented
  -- product/legal need exists (see docs/ARCHITECTURE.md, "Database Schema").
  ip_hash text,
  metadata jsonb
);

create index qr_scan_events_qr_code_id_idx on public.qr_scan_events (qr_code_id);
create index qr_scan_events_scanned_at_idx on public.qr_scan_events (scanned_at);
create index qr_scan_events_qr_code_id_scanned_at_idx
  on public.qr_scan_events (qr_code_id, scanned_at);

alter table public.qr_scan_events enable row level security;
