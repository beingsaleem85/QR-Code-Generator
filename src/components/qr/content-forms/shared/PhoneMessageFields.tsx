"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { smsQrSchema } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

/** sms and whatsapp schemas are structurally identical (phone + optional message). */
type PhoneMessageInput = z.infer<typeof smsQrSchema>;

interface PhoneMessageFieldsProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  schema: typeof smsQrSchema;
  messageLabel: string;
}

export function PhoneMessageFields({
  value,
  onChange,
  schema,
  messageLabel,
}: PhoneMessageFieldsProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<PhoneMessageInput>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      phone: typeof value.phone === "string" ? value.phone : "",
      message: typeof value.message === "string" ? value.message : "",
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Phone number" htmlFor="phone" error={errors.phone?.message}>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 555 123 4567"
          invalid={!!errors.phone}
          {...register("phone")}
        />
      </FormField>
      <FormField
        label={messageLabel}
        htmlFor="message"
        helperText="Optional"
        error={errors.message?.message}
      >
        <Textarea id="message" rows={3} invalid={!!errors.message} {...register("message")} />
      </FormField>
    </div>
  );
}
