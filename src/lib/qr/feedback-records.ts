import type { QrFeedbackSubmission } from "@/types/feedback";

/** Raw `qr_feedback_submissions` row shape (snake_case, as returned by supabase-js). */
export interface QrFeedbackSubmissionDbRow {
  id: string;
  rating: number | null;
  comment: string | null;
  contact: string | null;
  submitted_at: string;
}

export function toQrFeedbackSubmission(row: QrFeedbackSubmissionDbRow): QrFeedbackSubmission {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    contact: row.contact,
    submittedAt: row.submitted_at,
  };
}
