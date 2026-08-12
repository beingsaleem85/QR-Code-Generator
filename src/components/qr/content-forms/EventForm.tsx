"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventQrSchema, type EventQrInput } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface EventFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function EventForm({ value, onChange }: EventFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<EventQrInput>({
    resolver: zodResolver(eventQrSchema),
    mode: "onBlur",
    defaultValues: {
      title: asString(value.title),
      start: asString(value.start),
      end: asString(value.end),
      location: asString(value.location),
      description: asString(value.description),
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Event title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" type="text" invalid={!!errors.title} {...register("title")} />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Starts" htmlFor="start" error={errors.start?.message}>
          <Input id="start" type="datetime-local" invalid={!!errors.start} {...register("start")} />
        </FormField>
        <FormField label="Ends" htmlFor="end" helperText="Optional" error={errors.end?.message}>
          <Input id="end" type="datetime-local" invalid={!!errors.end} {...register("end")} />
        </FormField>
      </div>
      <FormField
        label="Location"
        htmlFor="location"
        helperText="Optional"
        error={errors.location?.message}
      >
        <Input id="location" type="text" invalid={!!errors.location} {...register("location")} />
      </FormField>
      <FormField
        label="Description"
        htmlFor="description"
        helperText="Optional"
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          rows={3}
          invalid={!!errors.description}
          {...register("description")}
        />
      </FormField>
    </div>
  );
}
