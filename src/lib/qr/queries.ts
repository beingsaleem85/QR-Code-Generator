import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toQrCodeRecord, type QrCodeDbRow, type QrCodeRecord } from "@/lib/qr/records";

/**
 * Read-only, RLS-scoped `qr_codes` queries for Server Components. No
 * explicit `user_id` filter is added — RLS's `qr_codes_select_own` policy
 * (Module 1.5) already restricts every row to the authenticated caller, so
 * a redundant client-side filter would just duplicate what the database
 * already guarantees.
 */

export async function listQrCodes(options?: {
  includeArchived?: boolean;
}): Promise<QrCodeRecord[]> {
  const supabase = await createClient();
  let query = supabase.from("qr_codes").select("*").order("updated_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data as QrCodeDbRow[]).map(toQrCodeRecord);
}

/**
 * Returns `null` for both "doesn't exist" and "exists but isn't yours" —
 * RLS makes the two cases indistinguishable at the query level, which is
 * the correct behavior: a 404 shouldn't reveal whether a given id belongs
 * to someone else.
 */
export async function getQrCodeById(id: string): Promise<QrCodeRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("qr_codes").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return toQrCodeRecord(data as QrCodeDbRow);
}
