"use client";

import { smsQrSchema } from "@/lib/validation/qr";
import { PhoneMessageFields } from "@/components/qr/content-forms/shared/PhoneMessageFields";

interface SmsFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function SmsForm({ value, onChange }: SmsFormProps) {
  return (
    <PhoneMessageFields
      value={value}
      onChange={onChange}
      schema={smsQrSchema}
      messageLabel="Message"
    />
  );
}
