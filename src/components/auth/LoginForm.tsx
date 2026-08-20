"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/profile";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

/** Only follow a same-app dashboard redirect — never an arbitrary URL from the query string. */
function safeRedirectTarget(): string {
  const requested = new URLSearchParams(window.location.search).get("redirectTo");
  return requested && requested.startsWith("/dashboard") ? requested : "/dashboard";
}

/**
 * @supabase/ssr's browser storage always writes its auth cookies with a
 * fixed ~400-day Max-Age (see its `setItem`, which re-applies
 * `DEFAULT_COOKIE_OPTIONS.maxAge` unconditionally) — there's no supported
 * option to make it write a session-only cookie instead. To actually honor
 * "Remember me" being unchecked, re-serialize the cookies it just set
 * without a Max-Age/Expires, right after a successful sign-in: the browser
 * then treats them as session cookies and drops them when the browser
 * itself closes, while every other attribute (path, value, SameSite) stays
 * exactly what Supabase wrote.
 */
function forgetSessionOnBrowserClose() {
  const AUTH_COOKIE_PATTERN = /^sb-.*-auth-token(\.\d+)?$/;
  document.cookie.split("; ").forEach((pair) => {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) return;
    const name = pair.slice(0, separatorIndex);
    if (!AUTH_COOKIE_PATTERN.test(name)) return;
    const value = pair.slice(separatorIndex + 1);
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
  });
}

export function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), mode: "onBlur" });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setFormError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setSubmitting(false);
      setFormError(error.message);
      return;
    }

    if (!rememberMe) forgetSessionOnBrowserClose();

    await ensureProfile(supabase, data.user);
    router.push(safeRedirectTarget());
    router.refresh();
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
          autoComplete="current-password"
          invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-foreground select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Signing in..." : "Log in"}
      </Button>
    </form>
  );
}
