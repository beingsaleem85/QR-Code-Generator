"use client";

import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface QRNameFieldProps {
  name: string;
  onNameChange: (name: string) => void;
}

export function QRNameField({ name, onNameChange }: QRNameFieldProps) {
  return (
    <FormField label="QR name" htmlFor="qr-name">
      <Input
        id="qr-name"
        type="text"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="My QR code"
      />
    </FormField>
  );
}
