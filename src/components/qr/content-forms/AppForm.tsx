"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { appQrSchema } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface AppFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/**
 * `z.input`, not `z.output`/`AppQrInput` — `appQrSchema` wraps its object in
 * `.refine()` on top of fields that `.transform()` (the optional-URL
 * https-prepend), which makes the resolver's expected pre- and
 * post-validation shapes diverge just enough that `zodResolver` only
 * type-checks against the input shape here.
 */
type AppFormValues = z.input<typeof appQrSchema>;

export function AppForm({ value, onChange }: AppFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<AppFormValues>({
    resolver: zodResolver(appQrSchema),
    mode: "onBlur",
    defaultValues: {
      title: typeof value.title === "string" ? value.title : "",
      iosUrl: typeof value.iosUrl === "string" ? value.iosUrl : "",
      androidUrl: typeof value.androidUrl === "string" ? value.androidUrl : "",
      fallbackUrl: typeof value.fallbackUrl === "string" ? value.fallbackUrl : "",
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Page title" htmlFor="app-title" error={errors.title?.message}>
        <Input
          id="app-title"
          type="text"
          placeholder="Get our app"
          invalid={!!errors.title}
          {...register("title")}
        />
      </FormField>
      <FormField label="App Store URL" htmlFor="app-ios" error={errors.iosUrl?.message}>
        <Input
          id="app-ios"
          type="text"
          placeholder="apps.apple.com/..."
          invalid={!!errors.iosUrl}
          {...register("iosUrl")}
        />
      </FormField>
      <FormField label="Google Play URL" htmlFor="app-android" error={errors.androidUrl?.message}>
        <Input
          id="app-android"
          type="text"
          placeholder="play.google.com/store/apps/..."
          invalid={!!errors.androidUrl}
          {...register("androidUrl")}
        />
      </FormField>
      <FormField
        label="Fallback website"
        htmlFor="app-fallback"
        helperText="Shown to visitors on a device with no matching store link"
        error={errors.fallbackUrl?.message}
      >
        <Input
          id="app-fallback"
          type="text"
          invalid={!!errors.fallbackUrl}
          {...register("fallbackUrl")}
        />
      </FormField>
    </div>
  );
}
