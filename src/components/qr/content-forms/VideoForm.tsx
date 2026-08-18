"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { videoQrSchema, type VideoQrInput } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface VideoFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/**
 * No file upload — the master prompt prefers an external video host
 * (YouTube/Vimeo/etc.) over self-hosting, so this is just a URL field, the
 * same shape/pattern as `UrlForm`.
 */
export function VideoForm({ value, onChange }: VideoFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<VideoQrInput>({
    resolver: zodResolver(videoQrSchema),
    mode: "onBlur",
    defaultValues: {
      url: typeof value.url === "string" ? value.url : "",
      title: typeof value.title === "string" ? value.title : "",
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Video URL" htmlFor="video-url" error={errors.url?.message}>
        <Input
          id="video-url"
          type="text"
          placeholder="youtube.com/watch?v=... or https://vimeo.com/..."
          invalid={!!errors.url}
          {...register("url")}
        />
      </FormField>
      <FormField label="Title" htmlFor="video-title" helperText="Optional">
        <Input id="video-title" type="text" {...register("title")} />
      </FormField>
    </div>
  );
}
