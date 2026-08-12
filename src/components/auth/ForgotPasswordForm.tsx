"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), mode: "onBlur" });

  const onSubmit = handleSubmit(async () => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);
    setSubmitted(true);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Email"
        htmlFor="email"
        error={errors.email?.message}
        helperText="We'll send a password reset link to this address."
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Sending..." : "Send reset link"}
      </Button>

      {submitted ? (
        <p className="text-center text-xs text-muted-foreground">
          Password recovery isn&apos;t connected to a backend yet — arrives in Module 3.1.
        </p>
      ) : null}
    </form>
  );
}
