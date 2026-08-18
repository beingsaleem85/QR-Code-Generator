"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/profile";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function SignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema), mode: "onBlur" });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setFormError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });

    if (error) {
      setSubmitting(false);
      setFormError(error.message);
      return;
    }

    setSubmitting(false);

    // A session comes back immediately when the project has email
    // confirmation disabled; otherwise the user must click the emailed
    // link first (handled by /auth/callback), so just tell them to check.
    if (data.session && data.user) {
      await ensureProfile(supabase, data.user);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSubmitted(true);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>

      <Button type="submit" disabled={submitting || submitted} className="w-full">
        {submitting ? "Creating account..." : "Create account"}
      </Button>

      {submitted ? (
        <Alert variant="success">
          Account created — check your email for a confirmation link to finish signing in.
        </Alert>
      ) : null}
    </form>
  );
}
