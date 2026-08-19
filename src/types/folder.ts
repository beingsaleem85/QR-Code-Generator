/** One row from `qr_folders` (Module 1.4) — owner-only, optional single-level organization. */
export interface QrFolder {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Module 3.12 (Security Hardening): `qr_folders.name` had no length limit
 * anywhere, client or server — the same gap `MAX_QR_NAME_LENGTH`
 * (`src/lib/qr/action-types.ts`) fixed for a QR's own name. Lives here
 * (not in `src/lib/folders/actions.ts`, which has a top-level `"use
 * server"` directive and may only export async functions) so both the
 * server-side check and the client input's `maxLength` read the same
 * value.
 */
export const MAX_FOLDER_NAME_LENGTH = 80;
