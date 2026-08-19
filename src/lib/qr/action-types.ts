import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

/**
 * Split out from `actions.ts` because a file with a top-level `"use
 * server"` directive may only export async functions — Next's build fails
 * (opaquely, as "module has no exports") if a plain constant like
 * `AUTH_REQUIRED` is exported alongside the server actions.
 */

export interface SaveQrCodeInput {
  name: string;
  mode: QRMode;
  qrType: QRType;
  content: Record<string, unknown>;
  design: DesignConfig;
}

/**
 * `error` is a stable machine-readable code for cases the caller needs to
 * branch on (currently only `AUTH_REQUIRED`); anything else is already a
 * user-presentable message. Never throws for expected failure paths (bad
 * input, no session, RLS-blocked) — callers await a plain result and
 * decide what to do, including preserving in-progress builder state,
 * rather than losing it to an uncaught rejection.
 */
export type ActionResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

export const AUTH_REQUIRED = "AUTH_REQUIRED";

/**
 * Module 3.12 (Security Hardening): the one free-text field in this app
 * that had no length limit anywhere, client or server — every QR-type
 * content schema already bounds its own text fields
 * (`src/lib/validation/qr/*.ts`). Matches the convention already used for
 * comparable "title" fields (Module 3.9's `social`/`menu`/`feedback`
 * schemas). Shared here (not in `actions.ts`, which may only export async
 * functions) so both the server-side check and the client input's
 * `maxLength` read the same value.
 */
export const MAX_QR_NAME_LENGTH = 120;
