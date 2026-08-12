"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phoneQrSchema, type PhoneQrInput } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface PhoneFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function PhoneForm({ value, onChange }: PhoneFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<PhoneQrInput>({
    resolver: zodResolver(phoneQrSchema),
    mode: "onBlur",
    defaultValues: { phone: typeof value.phone === "string" ? value.phone : "" },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <FormField label="Phone number" htmlFor="phone" error={errors.phone?.message}>
      <Input
        id="phone"
        type="tel"
        placeholder="+1 555 123 4567"
        invalid={!!errors.phone}
        {...register("phone")}
      />
    </FormField>
  );
}
