"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { barcode2dQrSchema, type Barcode2dQrInput } from "@/lib/validation/qr/barcode-2d";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

interface Barcode2DFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function Barcode2DForm({ value, onChange }: Barcode2DFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<Barcode2dQrInput>({
    resolver: zodResolver(barcode2dQrSchema),
    mode: "onBlur",
    defaultValues: {
      data: typeof value.data === "string" ? value.data : "",
      encoding: value.encoding === "gs1" ? "gs1" : "standard",
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <FormField
        label="Barcode Content"
        htmlFor="barcode-data"
        helperText="Data Matrix ECC 200 standard (ISO/IEC 16022). Up to 1000 characters."
        error={errors.data?.message}
      >
        <Textarea
          id="barcode-data"
          rows={4}
          placeholder="Enter text, serial numbers, GTIN, or formatted data..."
          invalid={!!errors.data}
          {...register("data")}
        />
      </FormField>

      <FormField
        label="Encoding Standard"
        htmlFor="barcode-encoding"
        helperText="Standard ASCII for general data, or GS1 for retail/pharmaceutical application identifiers."
      >
        <Select id="barcode-encoding" {...register("encoding")}>
          <option value="standard">Standard Data Matrix ECC 200</option>
          <option value="gs1">GS1 DataMatrix (with Application Identifiers)</option>
        </Select>
      </FormField>
    </div>
  );
}
