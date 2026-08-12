"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vcardQrSchema, type VCardQrInput } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface VCardFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function VCardForm({ value, onChange }: VCardFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<VCardQrInput>({
    resolver: zodResolver(vcardQrSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: asString(value.firstName),
      lastName: asString(value.lastName),
      phone: asString(value.phone),
      mobile: asString(value.mobile),
      email: asString(value.email),
      website: asString(value.website),
      company: asString(value.company),
      title: asString(value.title),
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="First name" htmlFor="firstName" error={errors.firstName?.message}>
        <Input id="firstName" type="text" invalid={!!errors.firstName} {...register("firstName")} />
      </FormField>
      <FormField label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
        <Input id="lastName" type="text" invalid={!!errors.lastName} {...register("lastName")} />
      </FormField>
      <FormField label="Company" htmlFor="company" error={errors.company?.message}>
        <Input id="company" type="text" invalid={!!errors.company} {...register("company")} />
      </FormField>
      <FormField label="Job title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" type="text" invalid={!!errors.title} {...register("title")} />
      </FormField>
      <FormField label="Phone" htmlFor="vcard-phone" error={errors.phone?.message}>
        <Input id="vcard-phone" type="tel" invalid={!!errors.phone} {...register("phone")} />
      </FormField>
      <FormField label="Mobile" htmlFor="mobile" error={errors.mobile?.message}>
        <Input id="mobile" type="tel" invalid={!!errors.mobile} {...register("mobile")} />
      </FormField>
      <FormField label="Email" htmlFor="vcard-email" error={errors.email?.message}>
        <Input id="vcard-email" type="email" invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField label="Website" htmlFor="website" error={errors.website?.message}>
        <Input id="website" type="url" invalid={!!errors.website} {...register("website")} />
      </FormField>
    </div>
  );
}
