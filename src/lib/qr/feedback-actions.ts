"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { feedbackSubmissionSchema } from "@/lib/validation/qr";
import type { ActionResult } from "@/lib/qr/action-types";
import { checkRateLimit, readClientIp } from "@/lib/rate-limit";

/** Module 3.12: much tighter than the redirect limit — a real visitor submits once, not repeatedly. */
const FEEDBACK_RATE_LIMIT = { maxPerWindow: 5, windowSeconds: 3600 };

/**
 * Public, unauthenticated write path for the feedback landing page — no
 * session required, matching the master prompt's own requirement that a
 * visitor submit feedback with no account. Validated again here (never
 * trust the client alone) before ever reaching `submit_qr_feedback`, the
 * SECURITY DEFINER RPC that does the actual insert
 * (`supabase/migrations/20260819190000_add_feedback_submissions.sql`).
 * `consent` never reaches the RPC — it's purely an app-layer gate (the
 * master prompt's "store feedback only if... consent requirements are
 * handled") checked here, not a column on the stored row.
 */
export async function submitQrFeedback(
  slug: string,
  input: unknown,
): Promise<ActionResult<{ submitted: true }>> {
  const parsed = feedbackSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check your feedback before submitting." };
  }

  const clientIp = readClientIp(await headers());
  if (clientIp) {
    const allowed = await checkRateLimit(`feedback:${slug}:${clientIp}`, FEEDBACK_RATE_LIMIT);
    if (!allowed) {
      return { error: "Please wait before submitting more feedback." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_qr_feedback", {
    p_slug: slug,
    p_rating: parsed.data.rating ?? null,
    p_comment: parsed.data.comment ?? null,
    p_contact: parsed.data.contact ?? null,
  });

  if (error) {
    return { error: "Couldn't submit your feedback — please try again." };
  }
  return { data: { submitted: true } };
}
