import { z } from "zod";

/**
 * Validates geographic coordinates and optional label/address for the Location QR type.
 * Latitude must be within [-90, 90], Longitude within [-180, 180].
 * Supports maps URL or geo: URI format.
 */
export const locationQrSchema = z.object({
  latitude: z.coerce
    .number({ message: "Latitude must be a valid number" })
    .finite("Latitude must be a valid number")
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce
    .number({ message: "Longitude must be a valid number" })
    .finite("Longitude must be a valid number")
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  query: z.string().max(200, "Place name/query must be 200 characters or less").optional(),
  format: z.enum(["maps", "geo"]).optional(),
});

export type LocationQrInput = z.infer<typeof locationQrSchema>;
