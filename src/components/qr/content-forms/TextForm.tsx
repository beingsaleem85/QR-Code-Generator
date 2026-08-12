"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { textQrSchema, type TextQrInput } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";

interface TextFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function TextForm({ value, onChange }: TextFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<TextQrInput>({
    resolver: zodResolver(textQrSchema),
    mode: "onBlur",
    defaultValues: { text: typeof value.text === "string" ? value.text : "" },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <FormField label="Text" htmlFor="text" error={errors.text?.message}>
      <Textarea
        id="text"
        rows={4}
        placeholder="Enter any text to encode"
        invalid={!!errors.text}
        {...register("text")}
      />
    </FormField>
  );
}
