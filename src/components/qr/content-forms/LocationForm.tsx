"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { locationQrSchema } from "@/lib/validation/qr/location";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { z } from "zod";

type LocationFormValues = z.input<typeof locationQrSchema>;

interface LocationFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function LocationForm({ value, onChange }: LocationFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationQrSchema),
    mode: "onBlur",
    defaultValues: {
      latitude:
        typeof value.latitude === "number"
          ? value.latitude
          : typeof value.latitude === "string" && !isNaN(Number(value.latitude))
            ? Number(value.latitude)
            : undefined,
      longitude:
        typeof value.longitude === "number"
          ? value.longitude
          : typeof value.longitude === "string" && !isNaN(Number(value.longitude))
            ? Number(value.longitude)
            : undefined,
      query: typeof value.query === "string" ? value.query : "",
      format: value.format === "geo" ? "geo" : "maps",
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Latitude"
          htmlFor="latitude"
          helperText="-90 to 90 (e.g. 37.7749)"
          error={errors.latitude?.message}
        >
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="37.7749"
            invalid={!!errors.latitude}
            {...register("latitude", { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label="Longitude"
          htmlFor="longitude"
          helperText="-180 to 180 (e.g. -122.4194)"
          error={errors.longitude?.message}
        >
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="-122.4194"
            invalid={!!errors.longitude}
            {...register("longitude", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <FormField
        label="Location Name or Address (optional)"
        htmlFor="location-query"
        helperText="Optional place label displayed on maps"
        error={errors.query?.message}
      >
        <Input
          id="location-query"
          type="text"
          placeholder="e.g. Union Square, San Francisco"
          invalid={!!errors.query}
          {...register("query")}
        />
      </FormField>

      <FormField
        label="Format"
        htmlFor="location-format"
        helperText="Maps URL works on all devices; geo: URI opens native navigation apps"
      >
        <Select id="location-format" {...register("format")}>
          <option value="maps">Google Maps URL (broadest compatibility)</option>
          <option value="geo">Native geo: URI (RFC 5870)</option>
        </Select>
      </FormField>
    </div>
  );
}
