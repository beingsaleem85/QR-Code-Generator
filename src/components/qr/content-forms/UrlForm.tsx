"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { urlQrSchema, type UrlQrInput } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface UrlFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function UrlForm({ value, onChange }: UrlFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<UrlQrInput>({
    resolver: zodResolver(urlQrSchema),
    mode: "onBlur",
    defaultValues: { url: typeof value.url === "string" ? value.url : "" },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <FormField label="Destination URL" htmlFor="url" error={errors.url?.message}>
      <Input
        id="url"
        type="text"
        placeholder="example.com or https://example.com/page"
        invalid={!!errors.url}
        {...register("url")}
      />
    </FormField>
  );
}
