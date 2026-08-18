import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export interface Entitlement {
  plan: Plan;
  isLifetime: boolean;
  expiresAt: string | null;
  /** Max dynamic QR codes this account may have at once. `null` = unlimited. */
  dynamicQrLimit: number | null;
}

/**
 * No commercial free-tier cap has been decided anywhere in this project
 * yet, so the implicit "no row" entitlement stays unlimited too — the
 * enforcement mechanism below is real and fully wired, but there is
 * nothing configured for it to actually restrict until a real plan
 * decision sets a finite `dynamic_qr_limit` on some entitlement row.
 */
const FREE_ENTITLEMENT: Entitlement = {
  plan: "free",
  isLifetime: false,
  expiresAt: null,
  dynamicQrLimit: null,
};

interface EntitlementDbRow {
  plan: string;
  is_lifetime: boolean;
  expires_at: string | null;
  dynamic_qr_limit: number | null;
}

function toEntitlement(row: EntitlementDbRow): Entitlement {
  return {
    plan: row.plan as Plan,
    isLifetime: row.is_lifetime,
    expiresAt: row.expires_at,
    dynamicQrLimit: row.dynamic_qr_limit,
  };
}

/**
 * Reads a specific user's entitlement using an already-created Supabase
 * client — for server code (like `saveQrCode`) that already has one for
 * the same request and shouldn't create a second. A missing row means
 * "free" — `account_entitlements` only ever gets a row written by a
 * privileged, out-of-band operation (see the migration's own comment),
 * never by this app, so there's no write path here on purpose.
 */
export async function getEntitlementForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Entitlement> {
  const { data, error } = await supabase
    .from("account_entitlements")
    .select("plan, is_lifetime, expires_at, dynamic_qr_limit")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return FREE_ENTITLEMENT;
  return toEntitlement(data as EntitlementDbRow);
}

/** Reads the signed-in user's own entitlement (Account page display). */
export async function getMyEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FREE_ENTITLEMENT;

  return getEntitlementForUser(supabase, user.id);
}

export function planLabel(entitlement: Entitlement): string {
  if (entitlement.plan !== "pro") return "Free";
  return entitlement.isLifetime ? "Lifetime Pro" : "Pro";
}

export interface DynamicQrAllowance {
  allowed: boolean;
  /** Echoes the entitlement's limit — `null` means unlimited. */
  limit: number | null;
}

/**
 * Pure decision function: given an entitlement and how many dynamic QRs
 * the account currently has (active + paused — archived codes don't count
 * against the quota, the same way archiving already removes a QR from the
 * default dashboard list; a caller with an unlimited entitlement should
 * skip counting entirely rather than compute this to save the query, but
 * this function is correct either way since it ignores the count when the
 * limit is `null`).
 */
export function resolveDynamicQrAllowance(
  entitlement: Entitlement,
  currentDynamicQrCount: number,
): DynamicQrAllowance {
  if (entitlement.dynamicQrLimit === null) {
    return { allowed: true, limit: null };
  }
  return {
    allowed: currentDynamicQrCount < entitlement.dynamicQrLimit,
    limit: entitlement.dynamicQrLimit,
  };
}
