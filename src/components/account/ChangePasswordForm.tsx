"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";

type SaveStatus = "idle" | "saving" | "success" | "error";

/**
 * Changes the signed-in user's own password via Supabase Auth's
 * `updateUser({ password })` — the same call `ResetPasswordForm` makes
 * after a recovery-email link, since Supabase doesn't distinguish between
 * a recovery session and a normal one for this API. No current-password
 * field: the project's Auth settings
 * (`security_update_password_require_current_password` /
 * `security_update_password_require_reauthentication`) are both off, so
 * requiring one here would ask for a credential the backend doesn't need.
 */
export function ChangePasswordForm() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus("saving");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("success");
    reset();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4"
      onChange={() => {
        if (status !== "idle") setStatus("idle");
      }}
    >
      <FormField label="New password" htmlFor="new-password" error={errors.password?.message}>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Confirm new password"
        htmlFor="confirm-new-password"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirm-new-password"
          autoComplete="new-password"
          invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>

      <div>
        <Button type="submit" variant="secondary" disabled={status === "saving"}>
          {status === "saving" ? "Changing password…" : "Change password"}
        </Button>
      </div>

      {status === "success" ? <Alert variant="success">Password updated.</Alert> : null}
      {status === "error" ? <Alert variant="error">{errorMessage}</Alert> : null}
    </form>
  );
}
