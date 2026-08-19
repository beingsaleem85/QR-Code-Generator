import { z } from "zod";

/**
 * The owner's configuration for what a feedback QR collects — never
 * contains any actual visitor-submitted feedback (that lives in
 * `qr_feedback_submissions`, written only through the `submit_qr_feedback`
 * RPC, never through this schema).
 */
export const feedbackQrSchema = z
  .object({
    title: z.string().trim().min(1, "Give this page a title").max(120),
    collectRating: z.boolean().default(true),
    collectComment: z.boolean().default(true),
    collectContact: z.boolean().default(false),
    thankYouMessage: z.string().trim().max(300).optional(),
  })
  .refine((data) => data.collectRating || data.collectComment, {
    message: "Enable at least a rating or a comment field",
    path: ["collectRating"],
  });

export type FeedbackQrInput = z.infer<typeof feedbackQrSchema>;

/**
 * What a visitor actually submits on the public `/p/[slug]` landing page.
 * Validated client- and server-side before ever reaching the
 * `submit_qr_feedback` RPC — the RPC itself has no knowledge of this shape,
 * it just accepts three loose optional parameters (see the migration).
 */
export const feedbackSubmissionSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).optional(),
  contact: z.string().trim().max(200).optional(),
  consent: z.boolean().refine((value) => value === true, "Please confirm before submitting"),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
