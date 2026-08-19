/** One row from `qr_feedback_submissions` (Module 3.9), owner-visible only. */
export interface QrFeedbackSubmission {
  id: string;
  rating: number | null;
  comment: string | null;
  contact: string | null;
  submittedAt: string;
}
