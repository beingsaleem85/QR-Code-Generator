"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validation/account/profile";
import { updateDisplayName } from "@/lib/account/actions";
import { AUTH_REQUIRED } from "@/lib/qr/action-types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface AccountProfileFormProps {
  initialDisplayName: string;
  email: string;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

export function AccountProfileForm({ initialDisplayName, email }: AccountProfileFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: { displayName: initialDisplayName },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus("saving");
    setErrorMessage(null);

    const result = await updateDisplayName(values.displayName);

    if (result.error) {
      setStatus("error");
      setErrorMessage(
        result.error === AUTH_REQUIRED
          ? "Your session has expired — please log in again."
          : result.error,
      );
      return;
    }

    setStatus("success");
    // The header block above this form is server-rendered from the same
    // profile row (`account/page.tsx`) — refresh so it picks up the change
    // without a full reload, the same pattern every other mutation in this
    // app uses rather than duplicating server state into client state.
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormField label="Display name" htmlFor="displayName" error={errors.displayName?.message}>
        <Input
          id="displayName"
          autoComplete="name"
          invalid={!!errors.displayName}
          {...register("displayName", {
            onChange: () => {
              if (status !== "idle") setStatus("idle");
            },
          })}
        />
      </FormField>

      <FormField label="Email address" htmlFor="email">
        <Input id="email" type="email" value={email} disabled readOnly />
      </FormField>
      <p className="-mt-3 text-xs text-muted-foreground">
        Email changes are not available from this page yet.
      </p>

      <div>
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {status === "success" ? <Alert variant="success">Profile updated.</Alert> : null}
      {status === "error" ? <Alert variant="error">{errorMessage}</Alert> : null}
    </form>
  );
}
