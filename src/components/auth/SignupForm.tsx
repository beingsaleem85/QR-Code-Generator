"use client";

import { useState } from "react";
import Link from "next/link";
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
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { safeNext } from "@/lib/auth/safe-redirect";

/** Only follow a safe same-app redirect — never an arbitrary external or malformed URL. */
function safeRedirectTarget(): string {
  if (typeof window === "undefined") return "/dashboard";
  const requested = new URLSearchParams(window.location.search).get("redirectTo");
  return safeNext(requested);
}

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

    const target = safeRedirectTarget();
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${target === "/dashboard" ? "/dashboard" : encodeURIComponent(target)}`,
      },
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
      router.push(target);
      router.refresh();
      return;
    }

    setSubmitted(true);
  });

  return (
    <div className="flex flex-col gap-4">
      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <GoogleAuthButton
        disabled={submitting || submitted}
        onError={(msg) => setFormError(msg)}
        redirectTo={safeRedirectTarget()}
      />

      <div className="relative my-1 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <span className="relative bg-surface px-3 text-xs uppercase tracking-wider text-muted-foreground">
          or continue with email
        </span>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      {submitted ? (
        <Alert variant="success">
          Account created — check your email for a confirmation link to finish signing in.
        </Alert>
      ) : null}
    </form>
    </div>
  );
}
