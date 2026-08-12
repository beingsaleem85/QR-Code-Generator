"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailQrSchema, type EmailQrInput } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface EmailFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function EmailForm({ value, onChange }: EmailFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<EmailQrInput>({
    resolver: zodResolver(emailQrSchema),
    mode: "onBlur",
    defaultValues: {
      to: typeof value.to === "string" ? value.to : "",
      subject: typeof value.subject === "string" ? value.subject : "",
      body: typeof value.body === "string" ? value.body : "",
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Recipient email" htmlFor="to" error={errors.to?.message}>
        <Input
          id="to"
          type="email"
          placeholder="name@example.com"
          invalid={!!errors.to}
          {...register("to")}
        />
      </FormField>
      <FormField
        label="Subject"
        htmlFor="subject"
        helperText="Optional"
        error={errors.subject?.message}
      >
        <Input id="subject" type="text" invalid={!!errors.subject} {...register("subject")} />
      </FormField>
      <FormField label="Body" htmlFor="body" helperText="Optional" error={errors.body?.message}>
        <Textarea id="body" rows={3} invalid={!!errors.body} {...register("body")} />
      </FormField>
    </div>
  );
}
