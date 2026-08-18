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
