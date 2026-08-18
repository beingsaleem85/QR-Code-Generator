"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function ResetPasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setFormError(null);

    // Requires the temporary recovery session /auth/callback established
    // from the emailed link — if that's missing or expired, this errors.
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      setSubmitting(false);
      setFormError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <FormField label="New password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Confirm new password"
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

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
