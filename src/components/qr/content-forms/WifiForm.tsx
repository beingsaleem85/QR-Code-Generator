"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { wifiQrSchema, type WifiQrInput } from "@/lib/validation/qr";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface WifiFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function WifiForm({ value, onChange }: WifiFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<WifiQrInput>({
    resolver: zodResolver(wifiQrSchema),
    mode: "onBlur",
    defaultValues: {
      ssid: typeof value.ssid === "string" ? value.ssid : "",
      password: typeof value.password === "string" ? value.password : "",
      encryption:
        value.encryption === "WPA" || value.encryption === "WEP" || value.encryption === "nopass"
          ? value.encryption
          : "WPA",
      hidden: typeof value.hidden === "boolean" ? value.hidden : false,
    },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Record<string, unknown>));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Network name (SSID)" htmlFor="ssid" error={errors.ssid?.message}>
        <Input id="ssid" type="text" invalid={!!errors.ssid} {...register("ssid")} />
      </FormField>
      <FormField label="Encryption" htmlFor="encryption">
        <Select id="encryption" {...register("encryption")}>
          <option value="WPA">WPA/WPA2</option>
          <option value="WEP">WEP</option>
          <option value="nopass">None</option>
        </Select>
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="text" invalid={!!errors.password} {...register("password")} />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" {...register("hidden")} />
        Hidden network
      </label>
    </div>
  );
}
