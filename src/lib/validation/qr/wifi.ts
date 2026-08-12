import { z } from "zod";

export const wifiQrSchema = z
  .object({
    ssid: z.string().trim().min(1, "Enter a network name").max(32),
    password: z.string().max(63).optional(),
    encryption: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.boolean().optional(),
  })
  .refine((data) => data.encryption === "nopass" || !!data.password, {
    message: "Enter a password or set encryption to none",
    path: ["password"],
  });

export type WifiQrInput = z.infer<typeof wifiQrSchema>;
