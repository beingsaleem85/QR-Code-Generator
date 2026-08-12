"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validation/account/profile";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface AccountProfileFormProps {
  initialDisplayName: string;
  email: string;
}

export function AccountProfileForm({ initialDisplayName, email }: AccountProfileFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: { displayName: initialDisplayName },
  });

  const onSubmit = handleSubmit(async () => {
    setSubmitting(true);
    // No backend yet — real profile updates are wired in Module 3.1. This
    // delay stands in for a real request so the loading state is genuinely
    // exercised, not just declared.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);
    setSubmitted(true);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormField label="Display name" htmlFor="displayName" error={errors.displayName?.message}>
        <Input
          id="displayName"
          autoComplete="name"
          invalid={!!errors.displayName}
          {...register("displayName")}
        />
      </FormField>

      <FormField label="Email" htmlFor="email">
        <Input id="email" type="email" value={email} disabled readOnly />
      </FormField>
      <p className="-mt-3 text-xs text-muted-foreground">
        Email changes will be available once sign-in is connected in Module 3.1.
      </p>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save changes"}
        </Button>
      </div>

      {submitted ? (
        <Alert variant="info">
          Profile updates aren&apos;t connected to a backend yet — arrives in Module 3.1.
        </Alert>
      ) : null}
    </form>
  );
}
