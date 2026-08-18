import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export interface Entitlement {
  plan: Plan;
  isLifetime: boolean;
  expiresAt: string | null;
}

const FREE_ENTITLEMENT: Entitlement = { plan: "free", isLifetime: false, expiresAt: null };

interface EntitlementDbRow {
  plan: string;
  is_lifetime: boolean;
  expires_at: string | null;
}

/**
 * Reads the signed-in user's plan entitlement. A missing row (the common
 * case — most users have never had one written) means "free", the same as
 * an explicit free row would — `account_entitlements` only ever gets a row
 * written by a privileged, out-of-band operation (see the migration's own
 * comment), never by this app. There is no write path here on purpose.
 */
export async function getMyEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FREE_ENTITLEMENT;

  const { data, error } = await supabase
    .from("account_entitlements")
    .select("plan, is_lifetime, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return FREE_ENTITLEMENT;

  const row = data as EntitlementDbRow;
  return { plan: row.plan as Plan, isLifetime: row.is_lifetime, expiresAt: row.expires_at };
}

export function planLabel(entitlement: Entitlement): string {
  if (entitlement.plan !== "pro") return "Free";
  return entitlement.isLifetime ? "Lifetime Pro" : "Pro";
}
