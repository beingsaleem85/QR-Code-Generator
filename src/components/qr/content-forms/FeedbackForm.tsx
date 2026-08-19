"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { feedbackQrSchema } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface FeedbackFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/** See `AppForm`'s `AppFormValues` doc comment — same `.refine()`-over-defaulted-fields shape. */
type FeedbackFormValues = z.input<typeof feedbackQrSchema>;

/**
 * This is the owner's *configuration* of what a feedback page collects —
 * never actual visitor feedback, which never touches this form (see
 * `feedbackQrSchema`'s doc comment).
 */
export function FeedbackForm({ value, onChange }: FeedbackFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackQrSchema),
    mode: "onBlur",
    defaultValues: {
      title: typeof value.title === "string" ? value.title : "How was your experience?",
      collectRating: typeof value.collectRating === "boolean" ? value.collectRating : true,
      collectComment: typeof value.collectComment === "boolean" ? value.collectComment : true,
      collectContact: typeof value.collectContact === "boolean" ? value.collectContact : false,
      thankYouMessage: typeof value.thankYouMessage === "string" ? value.thankYouMessage : "",
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Prompt / title" htmlFor="feedback-title" error={errors.title?.message}>
        <Input id="feedback-title" type="text" invalid={!!errors.title} {...register("title")} />
      </FormField>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register("collectRating")} />
          Collect a 1–5 star rating
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register("collectComment")} />
          Collect a short text comment
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register("collectContact")} />
          Collect an optional contact field (email or phone)
        </label>
        {errors.collectRating ? (
          <p className="text-xs text-destructive">{errors.collectRating.message}</p>
        ) : null}
      </div>

      <FormField
        label="Thank-you message"
        htmlFor="feedback-thanks"
        helperText="Optional — shown after a visitor submits"
      >
        <Textarea id="feedback-thanks" rows={2} {...register("thankYouMessage")} />
      </FormField>

      <p className="text-xs text-muted-foreground">
        Visitors see a consent notice and must opt in before any feedback is stored — see{" "}
        <span className="font-medium">/privacy</span> for the full disclosure.
      </p>
    </div>
  );
}
