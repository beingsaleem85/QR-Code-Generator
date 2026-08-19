"use client";

import { useState } from "react";
import { submitQrFeedback } from "@/lib/qr/feedback-actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";

interface FeedbackLandingPageProps {
  slug: string;
  payloadData: Record<string, unknown>;
}

interface FeedbackPayload {
  title?: string;
  collectRating?: boolean;
  collectComment?: boolean;
  collectContact?: boolean;
  thankYouMessage?: string;
}

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

/**
 * The one landing page in this module with real write-back — everything
 * else here is read-only. Consent is a required, unchecked-by-default
 * checkbox (the master prompt's "store feedback only if... consent
 * requirements are handled") — the submit button stays disabled until it's
 * checked, and the server action re-validates it independently.
 */
export function FeedbackLandingPage({ slug, payloadData }: FeedbackLandingPageProps) {
  const {
    title,
    collectRating = true,
    collectComment = true,
    collectContact = false,
    thankYouMessage,
  } = payloadData as FeedbackPayload;

  const [rating, setRating] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await submitQrFeedback(slug, {
      rating: collectRating ? rating : undefined,
      comment: collectComment && comment.trim() ? comment.trim() : undefined,
      contact: collectContact && contact.trim() ? contact.trim() : undefined,
      consent,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-sm p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {thankYouMessage || "Thanks for your feedback!"}
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <Card className="flex w-full max-w-sm flex-col gap-4 p-6">
        {title ? (
          <p className="text-center text-lg font-semibold text-foreground">{title}</p>
        ) : null}

        {collectRating ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Rating</span>
            <div className="flex gap-1">
              {RATING_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} out of 5`}
                  aria-pressed={rating === value}
                  className={`h-9 w-9 rounded-lg border text-sm font-medium ${
                    rating !== undefined && value <= rating
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {collectComment ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="feedback-comment" className="text-sm font-medium text-foreground">
              Comments
            </label>
            <Textarea
              id="feedback-comment"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </div>
        ) : null}

        {collectContact ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="feedback-contact" className="text-sm font-medium text-foreground">
              Contact (optional)
            </label>
            <Input
              id="feedback-contact"
              type="text"
              placeholder="Email or phone"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
            />
          </div>
        ) : null}

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5"
          />
          I agree that this feedback may be stored and reviewed by the business. See{" "}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
          .
        </label>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <Button type="button" onClick={handleSubmit} disabled={!consent || submitting}>
          {submitting ? "Submitting…" : "Submit feedback"}
        </Button>
      </Card>
    </main>
  );
}
