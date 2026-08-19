import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toQrCodeRecord, type QrCodeDbRow, type QrCodeRecord } from "@/lib/qr/records";
import { toQrScanEvent, type QrScanEventDbRow } from "@/lib/qr/scan-records";
import { toQrFeedbackSubmission, type QrFeedbackSubmissionDbRow } from "@/lib/qr/feedback-records";
import type { QrScanEvent } from "@/types/analytics";
import type { QrFeedbackSubmission } from "@/types/feedback";

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

const SCAN_EVENTS_WINDOW_DAYS = 30;

/**
 * Scan events for one QR, bounded to the last 30 days — the widest range
 * `AnalyticsView`'s own date-range filter offers, so every stat the UI
 * shows stays internally consistent (nothing implies "all-time" from a
 * query that only ever fetches a window). Relies on the composite
 * `(qr_code_id, scanned_at)` index from Module 1.4 for an efficient range
 * scan — no separate aggregation query or rollup needed at this project's
 * expected volume (Module 3.7's own "don't prematurely add complexity"
 * instruction). RLS-scoped via `qr_scan_events_select_own` (Module 1.5,
 * joins through `qr_codes.user_id`) — no explicit filter needed here, same
 * convention as `listQrCodes`/`getQrCodeById` above.
 */
/**
 * Dynamic QRs that are active *or* paused count against a finite plan
 * limit (`src/lib/account/entitlements.ts`); archived ones don't —
 * archiving is already the documented, non-destructive way to free up
 * room (Module 3.5), so it does double duty here rather than needing a
 * second "this doesn't count" mechanism.
 */
export async function countDynamicQrCodes(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("qr_codes")
    .select("id", { count: "exact", head: true })
    .eq("mode", "dynamic")
    .neq("status", "archived");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function listScanEvents(qrCodeId: string): Promise<QrScanEvent[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - SCAN_EVENTS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("qr_scan_events")
    .select("scanned_at, country_code, device_type, os, browser")
    .eq("qr_code_id", qrCodeId)
    .gte("scanned_at", since)
    .order("scanned_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data as QrScanEventDbRow[]).map(toQrScanEvent);
}

const FEEDBACK_SUBMISSIONS_LIMIT = 50;

/**
 * Most recent submissions for one feedback QR, owner-only (RLS's
 * `qr_feedback_submissions_select_own` policy). Bounded rather than
 * paginated — same "keep it simple" call Module 3.7 made for scan events,
 * appropriate at the same small scale.
 */
export async function listQrFeedback(qrCodeId: string): Promise<QrFeedbackSubmission[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_feedback_submissions")
    .select("id, rating, comment, contact, submitted_at")
    .eq("qr_code_id", qrCodeId)
    .order("submitted_at", { ascending: false })
    .limit(FEEDBACK_SUBMISSIONS_LIMIT);

  if (error) throw new Error(error.message);

  return (data as QrFeedbackSubmissionDbRow[]).map(toQrFeedbackSubmission);
}
