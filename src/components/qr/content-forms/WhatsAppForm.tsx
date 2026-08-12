"use client";

import { whatsappQrSchema } from "@/lib/validation/qr";
import { PhoneMessageFields } from "@/components/qr/content-forms/shared/PhoneMessageFields";

interface WhatsAppFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function WhatsAppForm({ value, onChange }: WhatsAppFormProps) {
  return (
    <PhoneMessageFields
      value={value}
      onChange={onChange}
      schema={whatsappQrSchema}
      messageLabel="Pre-filled message"
    />
  );
}
