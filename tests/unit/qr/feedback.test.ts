import { describe, expect, it } from "vitest";
import { feedbackQrSchema, feedbackSubmissionSchema } from "@/lib/validation/qr";
import { buildFeedbackPayload } from "@/lib/qr/payload-builders";

describe("feedbackQrSchema", () => {
  it("accepts the default config (rating + comment on, contact off)", () => {
    const result = feedbackQrSchema.safeParse({ title: "How was your visit?" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectRating).toBe(true);
      expect(result.data.collectComment).toBe(true);
      expect(result.data.collectContact).toBe(false);
    }
  });

  it("rejects disabling both rating and comment", () => {
    const result = feedbackQrSchema.safeParse({
      title: "How was your visit?",
      collectRating: false,
      collectComment: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(feedbackQrSchema.safeParse({ title: "" }).success).toBe(false);
  });
});

describe("feedbackSubmissionSchema", () => {
  it("accepts a full submission with consent", () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      comment: "Great service!",
      contact: "visitor@example.com",
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a submission with no rating/comment/contact, just consent", () => {
    expect(feedbackSubmissionSchema.safeParse({ consent: true }).success).toBe(true);
  });

  it("rejects a submission with consent false", () => {
    expect(feedbackSubmissionSchema.safeParse({ consent: false }).success).toBe(false);
  });

  it("rejects a submission missing consent entirely", () => {
    expect(feedbackSubmissionSchema.safeParse({ rating: 5 }).success).toBe(false);
  });

  it("rejects a rating outside 1-5", () => {
    expect(feedbackSubmissionSchema.safeParse({ rating: 6, consent: true }).success).toBe(false);
  });
});

describe("buildFeedbackPayload", () => {
  it("returns the title — never actually encoded into a QR image", () => {
    expect(
      buildFeedbackPayload({
        title: "How was your visit?",
        collectRating: true,
        collectComment: true,
        collectContact: false,
      }),
    ).toBe("How was your visit?");
  });
});
